exports.handler = async (event) => {
  console.log('[subscribe] Method:', event.httpMethod);
  console.log('[subscribe] Headers:', JSON.stringify(event.headers));
  console.log('[subscribe] Body raw:', event.body);

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    console.log('[subscribe] Handling OPTIONS preflight');
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    console.log('[subscribe] Rejected method:', event.httpMethod);
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  // Verificar API key
  if (!process.env.BREVO_API_KEY) {
    console.error('[subscribe] BREVO_API_KEY is undefined or empty');
    return { statusCode: 500, headers, body: 'Server misconfiguration: missing API key' };
  }
  console.log('[subscribe] BREVO_API_KEY present, length:', process.env.BREVO_API_KEY.length);

  // Parsear body
  let name, email, whatsapp;
  try {
    if (!event.body) {
      console.error('[subscribe] Body is empty or null');
      return { statusCode: 400, headers, body: 'Empty request body' };
    }
    const parsed = JSON.parse(event.body);
    name = parsed.name;
    email = parsed.email;
    whatsapp = parsed.whatsapp;
    console.log('[subscribe] Parsed body — name:', name, '| email:', email, '| whatsapp:', whatsapp);
  } catch (err) {
    console.error('[subscribe] JSON parse error:', err.message);
    return { statusCode: 400, headers, body: 'Invalid JSON' };
  }

  // Validar campos requeridos
  if (!email) {
    console.error('[subscribe] Missing required field: email');
    return { statusCode: 400, headers, body: 'Missing required field: email' };
  }

  try {
    const payload = {
      email,
      listIds: [3],
      attributes: {
        NOMBRE: name,
        SMS: whatsapp,
      },
      updateEnabled: true,
    };
    console.log('[subscribe] Sending to Brevo:', JSON.stringify(payload));

    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log('[subscribe] Brevo status:', response.status);
    console.log('[subscribe] Brevo response:', responseText);

    if (!response.ok) {
      console.error('[subscribe] Brevo rejected the request. Status:', response.status, '| Body:', responseText);
      return { statusCode: 500, headers, body: 'Failed to subscribe' };
    }

    console.log('[subscribe] Success for:', email);
    return { statusCode: 200, headers, body: 'OK' };
  } catch (err) {
    console.error('[subscribe] Unexpected error:', err.message, err.stack);
    return { statusCode: 500, headers, body: 'Internal Server Error' };
  }
};
