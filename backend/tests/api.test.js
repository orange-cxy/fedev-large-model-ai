// backend/tests/api.test.js - API测试文件
import { expect } from 'chai';
import request from 'supertest';
import app from '../server.js';
import dotenv from 'dotenv';

dotenv.config();

describe('API Tests', () => {
  describe('Root Endpoint', () => {
    it('should return welcome message', async () => {
      const res = await request(app).get('/');
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('message');
      expect(res.body.message).to.include('Welcome to Large Model AI API');
    });
  });

  describe('Health Check Routes', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('status');
      expect(res.body.status).to.equal('healthy');
    });

    it('should return detailed health information', async () => {
      const res = await request(app).get('/api/health/detailed');
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('components');
    });

    it('should respond to ping request', async () => {
      const res = await request(app).get('/api/health/ping');
      expect(res.status).to.equal(200);
      expect(res.body).to.deep.equal({ message: 'pong' });
    });
  });

  describe('Model Routes', () => {
    it('should return available models', async () => {
      const res = await request(app).get('/api/models');
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('models');
      expect(Array.isArray(res.body.models)).to.be.true;
    });

    it('should return default model', async () => {
      const res = await request(app).get('/api/models/default');
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('model');
    });
  });

  describe('System Routes', () => {
    it('should return system config', async () => {
      const res = await request(app).get('/api/system/config');
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('environment');
    });

    it('should return system stats', async () => {
      const res = await request(app).get('/api/system/stats');
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('uptime');
    });

    it('should return API version', async () => {
      const res = await request(app).get('/api/system/version');
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('apiVersion');
    });
  });

  describe('404 Handling', () => {
    it('should handle non-existent routes', async () => {
      const res = await request(app).get('/api/non-existent-route');
      expect(res.status).to.equal(404);
    });
  });
});

describe('Middleware Tests', () => {
  describe('Error Handling', () => {
    it('should handle invalid JSON payload', async () => {
      const res = await request(app)
        .post('/api/chat/completions')
        .send('invalid json')
        .set('Content-Type', 'application/json');
      
      expect(res.status).to.be.oneOf([400, 404]);
    });
  });

  describe('Security Headers', () => {
    it('should have security headers', async () => {
      const res = await request(app).get('/');
      expect(res.headers).to.have.property('x-dns-prefetch-control');
      expect(res.headers).to.have.property('x-frame-options');
      expect(res.headers).to.have.property('x-xss-protection');
    });
  });

  describe('CORS Support', () => {
    it('should support CORS', async () => {
      const res = await request(app).get('/');
      expect(res.headers).to.have.property('access-control-allow-origin');
    });
  });
});