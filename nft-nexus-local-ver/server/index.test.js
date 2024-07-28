const request = require('supertest');
const express = require('express');
const app = require('./index'); // Adjust path to your Express app

describe('Server Tests', () => {
  // Test registration
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/register')
      .send({ username: 'testuser', password: 'testpassword' });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.username).toBe('testuser');
  });

  // Test login
  it('should login a user', async () => {
    await request(app)
      .post('/register')
      .send({ username: 'testuser', password: 'testpassword' });

    const response = await request(app)
      .post('/login')
      .send({ username: 'testuser', password: 'testpassword' });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });

  // Test protected route
  it('should retrieve account details for authenticated user', async () => {
    const loginResponse = await request(app)
      .post('/login')
      .send({ username: 'testuser', password: 'testpassword' });

    const token = loginResponse.body.token;

    const response = await request(app)
      .get('/api/account')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('username', 'testuser');
  });

  // Add more tests for other routes
});