export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { phoneNumberId, accessToken, payload } = req.body || {};

  if (!phoneNumberId || !accessToken || !payload) {
    return res.status(400).json({
      error: 'Missing required fields: phoneNumberId, accessToken, and payload are required.'
    });
  }

  try {
    // Sanitize and handle any base64 images in template header parameters
    if (payload?.template?.components && Array.isArray(payload.template.components)) {
      const sanitizedComponents = [];

      for (const comp of payload.template.components) {
        if (comp.type === 'header' && Array.isArray(comp.parameters)) {
          let keepHeader = true;
          for (let p = 0; p < comp.parameters.length; p++) {
            const param = comp.parameters[p];
            if (param.type === 'image' && param.image) {
              const rawData = param.image.base64 || (param.image.link && param.image.link.startsWith('data:') ? param.image.link : null);

              if (rawData) {
                // Try uploading to Meta media endpoint
                try {
                  const match = rawData.match(/^data:([^;]+);base64,(.+)$/);
                  if (match) {
                    const mimeType = match[1];
                    const buffer = Buffer.from(match[2], 'base64');
                    const blob = new Blob([buffer], { type: mimeType });

                    const formData = new FormData();
                    formData.append('messaging_product', 'whatsapp');
                    formData.append('type', mimeType);
                    formData.append('file', blob, 'poster.jpg');

                    const uploadRes = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/media`, {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${accessToken.trim()}`
                      },
                      body: formData
                    });

                    const uploadData = await uploadRes.json();
                    if (uploadRes.ok && uploadData?.id) {
                      param.image = { id: uploadData.id };
                    } else {
                      console.warn('Meta media upload fallback:', uploadData);
                      keepHeader = false;
                    }
                  } else {
                    keepHeader = false;
                  }
                } catch (uploadErr) {
                  console.warn('Failed to upload base64 to Meta media:', uploadErr);
                  keepHeader = false;
                }
              } else if (param.image.link && !param.image.link.startsWith('http://') && !param.image.link.startsWith('https://')) {
                // Invalid URI scheme
                keepHeader = false;
              }
            }
          }

          if (keepHeader) {
            sanitizedComponents.push(comp);
          }
        } else {
          sanitizedComponents.push(comp);
        }
      }

      payload.template.components = sanitizedComponents;
    }

    const metaUrl = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
    let response = await fetch(metaUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    let data = await response.json();

    // Auto-retry on Meta Error #132001 (Template translation mismatch between en_US and en)
    if (!response.ok && data?.error?.code === 132001 && payload?.template?.language?.code) {
      const currentCode = payload.template.language.code;
      const altCode = currentCode === 'en_US' ? 'en' : (currentCode === 'en' ? 'en_US' : null);

      if (altCode) {
        payload.template.language.code = altCode;
        const retryRes = await fetch(metaUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken.trim()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        const retryData = await retryRes.json();
        if (retryRes.ok) {
          return res.status(200).json(retryData);
        }
      }
    }

    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Meta API server proxy error' });
  }
}
