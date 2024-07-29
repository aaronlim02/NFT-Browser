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

    // delete user, only to revert back the database
    it('should delete the user account', async () => {
      const loginResponse2 = await request(app)
        .post('/login')
        .send({ username: 'testuser', password: 'testpassword' });

      const token = loginResponse2.body.token;

      const deleteResponse = await request(app)
        .delete('/delete-user')
        .set('Authorization', `Bearer ${token}`);
  
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body).toHaveProperty('success', true);
  
      // Verify that the user is deleted by attempting to log in again
      const loginResponse = await request(app)
        .post('/login')
        .send({ username: 'testuser', password: 'testpassword' });
  
      expect(loginResponse.status).toBe(401); // Expect unauthorized since the user should not exist
      expect(loginResponse.body).toHaveProperty('error', 'Invalid credentials'); // Adjust the error message if needed
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

    it('should work with new password and change the user password back', async () => {
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
  
  describe('Watchlist CRUD Operations', () => {
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

  describe('Notifications Operations', () => {
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
      
  
      // Adding a notification for testing
      await request(app)
        .post('/notifications/add') // Assuming you have an endpoint to add notifications
        .set('Authorization', `Bearer ${token}`)
        .send({ collection_slug: 'test-collection', 
          collection_name: 'Test Collection',
          floor_price: 1, 
          createdAt: 'fake time', 
          updatedAt: 'fake time' });
          

      // Adding another notification for testing
      await request(app)
      .post('/notifications/add') // Assuming you have an endpoint to add notifications
      .set('Authorization', `Bearer ${token}`)
      .send({ collection_slug: 'test-collection-2', 
        collection_name: 'Test Collection 2',
        floor_price: 1, 
        createdAt: 'fake time', 
        updatedAt: 'fake time' });

      // Adding yet another notification for testing
      await request(app)
      .post('/notifications/add') // Assuming you have an endpoint to add notifications
      .set('Authorization', `Bearer ${token}`)
      .send({ collection_slug: 'test-collection-3', 
        collection_name: 'Test Collection 3',
        floor_price: 1, 
        createdAt: 'fake time', 
        updatedAt: 'fake time' });
    });
  
    it('should retrieve notifications for the account', async () => {
      const response = await request(app)
        .get('/notifications/retrieve_from_account')
        .set('Authorization', `Bearer ${token}`);
  
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);
      expect(response.body[0]).toHaveProperty('collection_slug', 'test-collection');
      expect(response.body[1]).toHaveProperty('collection_slug', 'test-collection-2');
      expect(response.body[2]).toHaveProperty('collection_slug', 'test-collection-3');
    });
  
    it('should delete a specific notification', async () => {
      // Retrieve notifications to get an ID
      const retrieveResponse = await request(app)
        .get('/notifications/retrieve_from_account')
        .set('Authorization', `Bearer ${token}`);
  
      expect(retrieveResponse.status).toBe(200);
      expect(retrieveResponse.body.length).toBeGreaterThan(0);
  
      const notification = retrieveResponse.body[0];
      const id = notification.id;
  
      // Delete the notification
      const deleteResponse = await request(app)
        .delete('/notifications/delete')
        .set('Authorization', `Bearer ${token}`)
        .send({ id });
  
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body).toHaveProperty('success', true);
      expect(deleteResponse.body).toHaveProperty('id', id);
  
      // Verify the notification was deleted
      const verifyResponse = await request(app)
        .get('/notifications/retrieve_from_account')
        .set('Authorization', `Bearer ${token}`);
  
      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body).toHaveLength(2);
      expect(verifyResponse.body).not.toContainEqual(expect.objectContaining({ id }));
    });
  
    it('should delete all notifications for the account', async () => {
      // Retrieve notifications to ensure there are notifications to delete
      const retrieveResponse = await request(app)
        .get('/notifications/retrieve_from_account')
        .set('Authorization', `Bearer ${token}`);
  
      expect(retrieveResponse.status).toBe(200);
  
      // Delete all notifications
      const deleteAllResponse = await request(app)
        .delete('/notifications/delete-all')
        .set('Authorization', `Bearer ${token}`);
  
      expect(deleteAllResponse.status).toBe(200);
      expect(deleteAllResponse.body).toHaveProperty('success', true);
  
      // Verify all notifications were deleted
      const verifyResponse = await request(app)
        .get('/notifications/retrieve_from_account')
        .set('Authorization', `Bearer ${token}`);
  
      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.length).toBe(0);
    });
  });

  describe.only('Galleries and Gallery Items Operations', () => {
    let token;
    let galleryId;
    let itemId;
  
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
  
    // Gallery Tests
    it('should add a new gallery', async () => {
      const response = await request(app)
        .post('/galleries/add')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Gallery',
          description: 'A gallery for testing'
        });
  
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('name', 'Test Gallery');
      galleryId = response.body.id; // Save gallery ID for further tests
    });
  
    it('should retrieve galleries for the account', async () => {
      const response = await request(app)
        .get('/galleries/retrieve_from_account')
        .set('Authorization', `Bearer ${token}`);
  
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('name', 'Test Gallery');
    });
  
    it('should edit a specific gallery', async () => {
      const response = await request(app)
        .put('/galleries/edit')
        .set('Authorization', `Bearer ${token}`)
        .query({ galleryId })
        .send({
          name: 'Updated Gallery',
          description: 'Updated description'
        });
  
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'Updated Gallery');
    });
  
    // Gallery Items Tests
    it('should add an item to a gallery', async () => {
      // Retrrieve gallery for item testing
      const response = await request(app)
        .get('/galleries/retrieve_from_account')
        .set('Authorization', `Bearer ${token}`);
  
      const galleryId = response.body[0].id; // Save gallery ID for item testing
  
      const itemResponse = await request(app)
        .post('/gallery-items/add')
        .set('Authorization', `Bearer ${token}`)
        .send({
          gallery_id: galleryId,
          contract_addr: '0x123',
          token_id: 'token123',
          collection_name: 'Test Collection Item'
        });
  
      expect(itemResponse.status).toBe(201);
      expect(itemResponse.body).toHaveProperty('collection_name', 'Test Collection Item');
      itemId = itemResponse.body.id; // Save item ID for further tests
    });
  
    it('should view items in a gallery', async () => {
      const response = await request(app)
        .get('/gallery-items/view')
        .set('Authorization', `Bearer ${token}`)
        .query({ galleryId });
  
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('collection_name', 'Test Collection Item');
    });
  
    it('should delete an item from a gallery', async () => {
      const response = await request(app)
        .delete('/gallery-items/delete')
        .set('Authorization', `Bearer ${token}`)
        .query({ itemId });
  
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
  
      // Verify deletion
      const verifyResponse = await request(app)
        .get('/gallery-items/view')
        .set('Authorization', `Bearer ${token}`)
        .query({ galleryId });
  
      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body).toHaveLength(0);
    });

    it('should delete a specific gallery', async () => {
      const response = await request(app)
        .delete('/galleries/delete')
        .set('Authorization', `Bearer ${token}`)
        .query({ galleryId });
  
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
  
      // Verify deletion
      const verifyResponse = await request(app)
        .get('/galleries/retrieve_from_account')
        .set('Authorization', `Bearer ${token}`);
  
      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body).toHaveLength(0);
    });

  });  

});