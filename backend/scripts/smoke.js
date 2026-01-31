// Smoke test script for backend APIs
(async () => {
  const base = 'http://localhost:3000/api';
  const headersJson = { 'Content-Type': 'application/json' };

  try {
    console.log('Registering test user...');
    let res = await fetch(`${base}/auth/register`, {
      method: 'POST',
      headers: headersJson,
      body: JSON.stringify({ name: 'Test User', email: 'testuser@example.com', password: 'password123', phone: '+911234567890' })
    });
    const reg = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(reg));
    const token = reg.token;
    const userId = reg.user.id;
    console.log('Registered:', userId);

    const authHeaders = { ...headersJson, Authorization: `Bearer ${token}` };

    console.log('GET /user/addresses');
    res = await fetch(`${base}/user/addresses`, { headers: authHeaders });
    console.log('addresses:', await res.json());

    console.log('POST /user/addresses');
    res = await fetch(`${base}/user/addresses`, {
      method: 'POST', headers: authHeaders,
      body: JSON.stringify({ type: 'home', name: 'Home', fullName: 'Test User', phone: '+911234567890', addressLine1: '123 Test St', city: 'TestCity', state: 'TS', pincode: '560000', country: 'India', isDefault: true })
    });
    const createdAddr = await res.json();
    console.log('created address:', createdAddr);
    const addrId = createdAddr.id;

    console.log('PUT /user/addresses/{id} update');
    res = await fetch(`${base}/user/addresses/${addrId}`, { method: 'PUT', headers: authHeaders, body: JSON.stringify({ name: 'Home Updated', city: 'NewCity' }) });
    console.log('updated:', await res.json());

    console.log('DELETE /user/addresses/{id}');
    res = await fetch(`${base}/user/addresses/${addrId}`, { method: 'DELETE', headers: authHeaders });
    console.log('deleted:', await res.json());

    console.log('Cart: add item');
    res = await fetch(`${base}/cart`, { method: 'POST', headers: authHeaders, body: JSON.stringify({ productId: 1, quantity: 2 }) });
    console.log('cart add:', await res.json());

    console.log('Cart: get');
    res = await fetch(`${base}/cart`, { headers: authHeaders });
    console.log('cart:', await res.json());

    console.log('Cart: update quantity');
    res = await fetch(`${base}/cart/1`, { method: 'PUT', headers: authHeaders, body: JSON.stringify({ quantity: 3 }) });
    console.log('cart update:', await res.json());

    console.log('Cart: remove item');
    res = await fetch(`${base}/cart/1`, { method: 'DELETE', headers: authHeaders });
    console.log('cart remove:', await res.json());

    console.log('Create order');
    res = await fetch(`${base}/orders`, { method: 'POST', headers: authHeaders, body: JSON.stringify({ userId, customer: 'Test User', items: [{ productId: 1, name: 'Test Product', price: 100, quantity: 1 }], total: 100, address: { street: '123 Test St' } }) });
    const createdOrder = await res.json();
    console.log('created order:', createdOrder);
    const orderId = createdOrder.order.id;

    console.log('Delivery: get status');
    res = await fetch(`${base}/delivery/${orderId}/status`, { headers: authHeaders });
    console.log('delivery status:', await res.json());

    console.log('Delivery: update status');
    res = await fetch(`${base}/delivery/${orderId}/status`, { method: 'PUT', headers: authHeaders, body: JSON.stringify({ status: 'out_for_delivery', location: { lat: 12.34, lng: 56.78 } }) });
    console.log('delivery update:', await res.json());

    console.log('Smoke tests completed');
  } catch (err) {
    console.error('Smoke test error:', err);
    process.exitCode = 1;
  }
})();
