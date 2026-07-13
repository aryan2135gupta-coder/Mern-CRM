import Activity from '../models/Activity.js';
import Lead from '../models/Lead.js';
import User from '../models/User.js';
import { logActivity } from '../utils/activityLogger.js';
import {
  sendLeadAssignedEmail,
  sendLeadCreatedEmail,
  sendLeadDeletedEmail,
  sendLeadStatusUpdatedEmail
} from '../utils/sendEmail.js';
import { getLeadAiInsights } from '../utils/gemini.js';
import { track } from '../utils/pulseiq.js';

const canAccessLead = (user, lead) => {
  return user.role === 'admin' || lead.assignedAgent._id.toString() === user._id.toString();
};

const buildLeadQuery = (req) => {
  const { status, agent, search, startDate, endDate } = req.query;
  const query = {};

  if (req.user.role === 'sales_agent') {
    query.assignedAgent = req.user._id;
  } else if (agent) {
    query.assignedAgent = agent;
  }

  if (status) {
    query.status = status;
  }

  if (search) {
    query.$text = { $search: search };
  }

  if (startDate || endDate) {
    query.createdAt = {};

    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }

    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }
  }

  return query;
};

const pickLeadFields = (body) => {
  const allowedFields = ['name', 'email', 'phone', 'source', 'status', 'assignedAgent', 'notes'];
  const leadData = {};

  allowedFields.forEach((field) => {
    if (body[field] !== undefined) {
      leadData[field] = body[field];
    }
  });

  return leadData;
};

const ensureAgentExists = async (agentId) => {
  const agent = await User.findOne({ _id: agentId, role: 'sales_agent' });

  if (!agent) {
    const error = new Error('Assigned agent was not found.');
    error.statusCode = 404;
    throw error;
  }

  return agent;
};

const describeLeadChanges = (lead, body) => {
  const changes = [];

  if (body.status && body.status !== lead.status) {
    changes.push({
      type: 'status_changed',
      message: `Status changed from ${lead.status} to ${body.status}`,
      metadata: { from: lead.status, to: body.status, field: 'status' }
    });
  }

  if (
    body.assignedAgent &&
    lead.assignedAgent?._id &&
    body.assignedAgent !== lead.assignedAgent._id.toString()
  ) {
    changes.push({
      type: 'assigned',
      message: 'Lead reassigned to another sales agent',
      metadata: {
        from: lead.assignedAgent._id.toString(),
        to: body.assignedAgent,
        field: 'assignedAgent'
      }
    });
  }

  if (body.notes !== undefined && body.notes !== lead.notes) {
    changes.push({
      type: 'note_updated',
      message: 'Notes updated',
      metadata: { field: 'notes' }
    });
  }

  const generalFields = ['name', 'email', 'phone', 'source'];
  generalFields.forEach((field) => {
    if (body[field] !== undefined && body[field] !== lead[field]) {
      changes.push({
        type: 'updated',
        message: `${field} updated`,
        metadata: { from: lead[field], to: body[field], field }
      });
    }
  });

  return changes;
};

export const createLead = async (req, res, next) => {
  try {
    if (req.user.role === 'admin' && !req.body.assignedAgent) {
      res.status(400);
      throw new Error('Assigned agent is required when an admin creates a lead.');
    }

    const assignedAgentId =
      req.user.role === 'sales_agent' ? req.user._id : req.body.assignedAgent;
    const assignedAgent = await ensureAgentExists(assignedAgentId);
    const leadData = pickLeadFields(req.body);

    const lead = await Lead.create({
      ...leadData,
      assignedAgent: assignedAgentId,
      createdBy: req.user._id
    });

    const populatedLead = await lead.populate([
      { path: 'assignedAgent', select: 'name email role' },
      { path: 'createdBy', select: 'name email role' }
    ]);

    await logActivity({
      lead: lead._id,
      user: req.user._id,
      type: 'created',
      message: `Lead created and assigned to ${assignedAgent.name}`,
      metadata: { assignedAgent: assignedAgent._id }
    });

    sendLeadAssignedEmail({
      to: assignedAgent.email,
      agentName: assignedAgent.name,
      leadName: lead.name
    }).catch((err) => console.error(`Error sending assignment email: ${err.message}`));

    sendLeadCreatedEmail({
      to: lead.email,
      leadName: lead.name
    }).catch((err) => console.error(`Error sending lead creation confirmation: ${err.message}`));

    track("lead_created", req.user._id, { leadId: lead._id, leadName: lead.name, status: lead.status });

    res.status(201).json({
      success: true,
      data: {
        lead: populatedLead
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getLeads = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const query = buildLeadQuery(req);

    const [leads, total] = await Promise.all([
      Lead.find(query)
        .populate('assignedAgent', 'name email role')
        .populate('createdBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Lead.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: leads.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: {
        leads
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getLead = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedAgent', 'name email role')
      .populate('createdBy', 'name email role');

    if (!lead) {
      res.status(404);
      throw new Error('Lead not found.');
    }

    if (!canAccessLead(req.user, lead)) {
      res.status(403);
      throw new Error('You do not have permission to view this lead.');
    }

    const activities = await Activity.find({ lead: lead._id })
      .populate('user', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        lead,
        activities
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateLead = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id).populate('assignedAgent', 'name email role');

    if (!lead) {
      res.status(404);
      throw new Error('Lead not found.');
    }

    if (!canAccessLead(req.user, lead)) {
      res.status(403);
      throw new Error('You do not have permission to update this lead.');
    }

    const previousAgentId = lead.assignedAgent._id.toString();
    const oldStatus = lead.status;
    const isStatusChanged = req.body.status && req.body.status !== oldStatus;
    let newAssignedAgent = null;
    const changes = describeLeadChanges(lead, req.body);

    if (
      req.user.role === 'sales_agent' &&
      req.body.assignedAgent &&
      req.body.assignedAgent !== req.user._id.toString()
    ) {
      res.status(403);
      throw new Error('Sales agents cannot reassign leads to another agent.');
    }

    if (req.body.assignedAgent) {
      newAssignedAgent = await ensureAgentExists(req.body.assignedAgent);
    }

    Object.assign(lead, pickLeadFields(req.body));
    await lead.save();

    const populatedLead = await lead.populate([
      { path: 'assignedAgent', select: 'name email role' },
      { path: 'createdBy', select: 'name email role' }
    ]);

    if (changes.length > 0) {
      await Promise.all(
        changes.map((change) =>
          logActivity({
            lead: lead._id,
            user: req.user._id,
            type: change.type,
            message: change.message,
            metadata: change.metadata
          })
        )
      );
    }

    if (newAssignedAgent && previousAgentId !== newAssignedAgent._id.toString()) {
      sendLeadAssignedEmail({
        to: newAssignedAgent.email,
        agentName: newAssignedAgent.name,
        leadName: lead.name,
        leadEmail: lead.email,
        leadPhone: lead.phone,
        source: lead.source,
        notes: lead.notes
      }).catch((err) => console.error(`Error sending assignment email: ${err.message}`));
    }

    if (isStatusChanged) {
      sendLeadStatusUpdatedEmail({
        leadEmail: lead.email,
        leadName: lead.name,
        agentEmail: lead.assignedAgent.email,
        agentName: lead.assignedAgent.name,
        oldStatus,
        newStatus: lead.status
      }).catch((err) => console.error(`Error sending status update email: ${err.message}`));

      track("lead_status_changed", req.user._id, { leadId: lead._id, leadName: lead.name, oldStatus, newStatus: lead.status });
    }

    res.status(200).json({
      success: true,
      data: {
        lead: populatedLead
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLead = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id).populate('assignedAgent', 'name email role');

    if (!lead) {
      res.status(404);
      throw new Error('Lead not found.');
    }

    if (req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Only administrators can delete leads.');
    }

    await Activity.deleteMany({ lead: lead._id });

    if (lead.assignedAgent?.email) {
      sendLeadDeletedEmail({
        to: lead.assignedAgent.email,
        agentName: lead.assignedAgent.name,
        leadName: lead.name
      }).catch((err) => console.error(`Error sending lead deletion email: ${err.message}`));
    }

    await lead.deleteOne();

    track("lead_deleted", req.user._id, { leadId: lead._id, leadName: lead.name });

    res.status(200).json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getLeadStats = async (req, res, next) => {
  try {
    const baseMatch = req.user.role === 'sales_agent' ? { assignedAgent: req.user._id } : {};
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    const [
      byStatus,
      totalLeads,
      convertedThisMonth,
      addedThisWeek,
      bySource,
      recentLeads,
      agentPerformance
    ] = await Promise.all([
      Lead.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Lead.countDocuments(baseMatch),
      Lead.countDocuments({
        ...baseMatch,
        status: 'converted',
        updatedAt: { $gte: monthStart }
      }),
      Lead.countDocuments({
        ...baseMatch,
        createdAt: { $gte: weekStart }
      }),
      Lead.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 }
      ]),
      Lead.find(baseMatch)
        .populate('assignedAgent', 'name email role')
        .sort({ createdAt: -1 })
        .limit(5),
      req.user.role === 'admin'
        ? Lead.aggregate([
            {
              $group: {
                _id: '$assignedAgent',
                total: { $sum: 1 },
                converted: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'converted'] }, 1, 0]
                  }
                }
              }
            },
            {
              $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'agent'
              }
            },
            { $unwind: '$agent' },
            {
              $project: {
                _id: 1,
                total: 1,
                converted: 1,
                conversionRate: {
                  $cond: [
                    { $gt: ['$total', 0] },
                    { $round: [{ $multiply: [{ $divide: ['$converted', '$total'] }, 100] }, 2] },
                    0
                  ]
                },
                agent: {
                  _id: '$agent._id',
                  name: '$agent.name',
                  email: '$agent.email'
                }
              }
            },
            { $sort: { converted: -1, total: -1 } },
            { $limit: 5 }
          ])
        : Promise.resolve([])
    ]);

    const statusCounts = {
      new: 0,
      contacted: 0,
      converted: 0,
      lost: 0
    };

    byStatus.forEach((item) => {
      statusCounts[item._id] = item.count;
    });

    res.status(200).json({
      success: true,
      data: {
        totalLeads,
        statusCounts,
        convertedThisMonth,
        addedThisWeek,
        conversionRate: totalLeads ? Number(((statusCounts.converted / totalLeads) * 100).toFixed(2)) : 0,
        sourceCounts: bySource.map((item) => ({
          source: item._id || 'unknown',
          count: item.count
        })),
        recentLeads,
        agentPerformance
      }
    });
  } catch (error) {
    next(error);
  }
};

export const exportLeads = async (req, res, next) => {
  try {
    const query = buildLeadQuery(req);
    const leads = await Lead.find(query).populate('assignedAgent', 'name email');
    
    let csv = 'Name,Email,Phone,Source,Status,Assigned Agent,Notes,Created Date\n';
    leads.forEach(lead => {
      const row = [
        `"${lead.name.replace(/"/g, '""')}"`,
        `"${lead.email.replace(/"/g, '""')}"`,
        `"${(lead.phone || '').replace(/"/g, '""')}"`,
        `"${(lead.source || '').replace(/"/g, '""')}"`,
        `"${lead.status}"`,
        `"${(lead.assignedAgent?.name || '').replace(/"/g, '""')}"`,
        `"${(lead.notes || '').replace(/\r?\n/g, ' ').replace(/"/g, '""')}"`,
        `"${lead.createdAt.toISOString()}"`
      ];
      csv += row.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=leads_export.csv');
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

export const importLeads = async (req, res, next) => {
  try {
    const { csv } = req.body;
    if (!csv) {
      res.status(400);
      throw new Error('CSV data is required');
    }

    const lines = csv.split(/\r?\n/);
    if (lines.length <= 1) {
      res.status(400);
      throw new Error('CSV is empty or lacks headers');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
    const nameIdx = headers.indexOf('name');
    const emailIdx = headers.indexOf('email');
    const phoneIdx = headers.indexOf('phone');
    const sourceIdx = headers.indexOf('source');
    const statusIdx = headers.indexOf('status');
    const notesIdx = headers.indexOf('notes');

    if (nameIdx === -1 || emailIdx === -1) {
      res.status(400);
      throw new Error('CSV must contain at least "Name" and "Email" columns');
    }

    const defaultAgent = await User.findOne({ role: 'sales_agent', isActive: true });
    if (!defaultAgent) {
      res.status(404);
      throw new Error('No active sales agent found to assign imported leads.');
    }

    const createdLeads = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
      const fields = matches.map(f => f.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

      const name = fields[nameIdx];
      const email = fields[emailIdx]?.toLowerCase();
      if (!name || !email) continue;

      const existing = await Lead.findOne({ email });
      if (existing) continue;

      const phone = phoneIdx !== -1 ? fields[phoneIdx] : '';
      const source = sourceIdx !== -1 ? fields[sourceIdx] : 'csv_import';
      const status = statusIdx !== -1 && ['new', 'contacted', 'converted', 'lost'].includes(fields[statusIdx]?.toLowerCase())
        ? fields[statusIdx]?.toLowerCase()
        : 'new';
      const notes = notesIdx !== -1 ? fields[notesIdx] : '';

      const lead = await Lead.create({
        name,
        email,
        phone,
        source,
        status,
        notes,
        assignedAgent: defaultAgent._id,
        createdBy: req.user._id
      });
      
      createdLeads.push(lead);
    }

    res.status(201).json({
      success: true,
      message: `Successfully imported ${createdLeads.length} leads.`,
      count: createdLeads.length
    });
  } catch (error) {
    next(error);
  }
};

export const addTask = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      res.status(404);
      throw new Error('Lead not found');
    }
    
    if (!canAccessLead(req.user, lead)) {
      res.status(403);
      throw new Error('You do not have access to this lead');
    }

    const { title, dueDate } = req.body;
    if (!title) {
      res.status(400);
      throw new Error('Task title is required');
    }

    lead.tasks.push({ title, dueDate });
    await lead.save();

    res.status(201).json({
      success: true,
      data: {
        lead
      }
    });
  } catch (error) {
    next(error);
  }
};

export const toggleTask = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      res.status(404);
      throw new Error('Lead not found');
    }
    
    if (!canAccessLead(req.user, lead)) {
      res.status(403);
      throw new Error('You do not have access to this lead');
    }

    const task = lead.tasks.id(req.params.taskId);
    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    task.isCompleted = !task.isCompleted;
    await lead.save();

    res.status(200).json({
      success: true,
      data: {
        lead
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      res.status(404);
      throw new Error('Lead not found');
    }
    
    if (!canAccessLead(req.user, lead)) {
      res.status(403);
      throw new Error('You do not have access to this lead');
    }

    lead.tasks.pull(req.params.taskId);
    await lead.save();

    res.status(200).json({
      success: true,
      data: {
        lead
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getLeadAiInsightsController = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      res.status(404);
      throw new Error('Lead not found');
    }

    if (!canAccessLead(req.user, lead)) {
      res.status(403);
      throw new Error('You do not have access to this lead');
    }

    const insights = await getLeadAiInsights({
      name: lead.name,
      status: lead.status,
      notes: lead.notes,
      tasks: lead.tasks
    });

    res.status(200).json({
      success: true,
      data: {
        insights
      }
    });
  } catch (error) {
    next(error);
  }
};

