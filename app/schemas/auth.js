const Joi = require('joi');

const loginRequestSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

const tokenResponseSchema = Joi.object({
  access_token: Joi.string().required(),
  refresh_token: Joi.string().optional(),
  expires_in: Joi.number().optional(),
  token_type: Joi.string().default('Bearer'),
});

module.exports = {
  loginRequestSchema,
  tokenResponseSchema,
};