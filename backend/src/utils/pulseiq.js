const PULSEIQ_API_KEY = process.env.PULSEIQ_API_KEY || "pk_7b54085eb2484c3497851be4cc842ffc";
const PULSEIQ_PROJECT_ID = process.env.PULSEIQ_PROJECT_ID || "6a5513bb4341710d2dcff26b";
const PULSEIQ_ENDPOINT = process.env.PULSEIQ_ENDPOINT || "https://pulseiq-ffio.onrender.com/api/ingest/event";

export const track = async (eventName, userId = null, properties = {}) => {
  try {
    await fetch(PULSEIQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": PULSEIQ_API_KEY,
      },
      body: JSON.stringify({
        projectId: PULSEIQ_PROJECT_ID,
        eventName,
        userId: userId || undefined,
        anonymousId: "server_event",
        properties,
      }),
    });
  } catch (error) {
    console.error('PulseIQ server-side track error:', error.message);
  }
};
