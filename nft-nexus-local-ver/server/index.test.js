const request = require('supertest');
const express = require('express');
const app = require('./index'); // Adjust path to your Express app

describe('Server Tests', () => {

  describe('Steps to create a new user', () => {
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

  });

  describe('Tests change settings', () => {

    it('should update personal details', async () => {
      // login
      const loginResponse = await request(app)
        .post('/login')
        .send({ username: 'testuser', password: 'testpassword' });
  
      const token = loginResponse.body.token;
  
      const response = await request(app)
        .post('/settings/personal-details')
        .set('Authorization', `Bearer ${token}`)
        .send({
          yourWalletAddress: '0x1234567890abcdef',
          lightDarkMode: 'dark',
        });
  
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('walletAddress', '0x1234567890abcdef');
      expect(response.body).toHaveProperty('lightDarkMode', 'dark');
    });
  
    it('should change the user password', async () => {
      // login
      const loginResponse = await request(app)
        .post('/login')
        .send({ username: 'testuser', password: 'testpassword' });
  
      const token = loginResponse.body.token;
  
      const response = await request(app)
        .post('/settings/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ newPassword: 'newpassword' });
  
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Password updated successfully');
    });
  
    it('should fail to change password if not authenticated', async () => {
      const response = await request(app)
        .post('/settings/change-password')
        .send({ newPassword: 'newpassword' });
  
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Unauthorized: No token provided');
    });

    it('should change the user password back', async () => {
      // login
      const loginResponse = await request(app)
        .post('/login')
        .send({ username: 'testuser', password: 'newpassword' });
  
      const token = loginResponse.body.token;
  
      const response = await request(app)
        .post('/settings/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ newPassword: 'testpassword' });
  
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Password updated successfully');
    });

  });
  
  describe.only('Watchlist CRUD Operations', () => {
    let token;
  
    beforeAll(async () => {
      // Register and login to get the token
      await request(app)
        .post('/register')
        .send({ username: 'testuser', password: 'testpassword' });
        
      const loginResponse = await request(app)
        .post('/login')
        .send({ username: 'testuser', password: 'testpassword' });
  
      token = loginResponse.body.token;
    });

    it('should add a collection to the watchlist', async () => {
      const response = await request(app)
        .post('/watchlist/add_from_nft_browser')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Collection', slug: 'test-collection' });
  
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('collection_name', 'Test Collection');
      expect(response.body).toHaveProperty('collection_slug', 'test-collection');
    });
  
    it('should retrieve watchlist and edit that item for the account', async () => {
      // Retrieve the watchlist
      const response = await request(app)
        .get('/watchlist/retrieve_from_account')
        .set('Authorization', `Bearer ${token}`);
  
      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
  
      const item = response.body.find(item => item.collection_name === 'Test Collection');
      expect(item).toBeDefined();
      const id = item.id;
  
      // Update the collection
      const updateResponse = await request(app)
        .put('/watchlist/edit')
        .set('Authorization', `Bearer ${token}`)
        .send({ id: id, set_price: 100 });
  
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body).toHaveProperty('set_price', 100);
      expect(updateResponse.body).toHaveProperty('id', id);
    });
  
    it('should delete a collection from the watchlist', async () => {
      // Retrieve the collection to get the ID
      const response = await request(app)
        .get('/watchlist/retrieve_from_account')
        .set('Authorization', `Bearer ${token}`);
  
      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
  
      const item = response.body.find(item => item.collection_name === 'Test Collection');
      expect(item).toBeDefined();
      const id = item.id;
  
      // Delete the collection
      const deleteResponse = await request(app)
        .delete('/watchlist/delete')
        .set('Authorization', `Bearer ${token}`)
        .send({ id });
  
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body).toHaveProperty('success', true);
      expect(deleteResponse.body).toHaveProperty('id', id);
  
      // Verify the collection was deleted
      const retrieveResponse = await request(app)
        .get('/watchlist/retrieve_from_account')
        .set('Authorization', `Bearer ${token}`);
  
      expect(retrieveResponse.status).toBe(200);
      expect(retrieveResponse.body).not.toContainEqual(expect.objectContaining({ id }));
    });

    it('should fail to add a collection to the watchlist if not authenticated', async () => {
      const response = await request(app)
        .post('/watchlist/add_from_nft_browser')
        .send({ name: 'Test Collection', slug: 'test-collection' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Unauthorized: No token provided');
    });

    it('should fail to retrieve watchlist if not authenticated', async () => {
      const response = await request(app)
        .get('/watchlist/retrieve_from_account');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Unauthorized: No token provided');
    });

    it('should fail to delete a collection from the watchlist if not authenticated', async () => {
      const response = await request(app)
        .delete('/watchlist/delete')
        .send({ id: 1 });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Unauthorized: No token provided');
    });

    it('should fail to update a collection in the watchlist if not authenticated', async () => {
      const response = await request(app)
        .put('/watchlist/edit')
        .send({ id: 1, set_price: 100 });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Unauthorized: No token provided');
    });

  });

});