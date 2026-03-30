exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  let name, email, whatsapp;
  try {
    ({ name, email, whatsapp } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, headers, body: 'Invalid JSON' };
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        email,
        listIds: [3],
        attributes: {
          FIRSTNAME: name,
          WHATSAPP: whatsapp,
        },
        updateEnabled: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Brevo error:', error);
      return { statusCode: 500, headers, body: 'Failed to subscribe' };
    }

    return { statusCode: 200, headers, body: 'OK' };
  } catch (err) {
    console.error('Function error:', err);
    return { statusCode: 500, headers, body: 'Internal Server Error' };
  }
};
