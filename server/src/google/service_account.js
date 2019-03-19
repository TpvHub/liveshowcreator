'use strict';
require('dotenv').config('../../.env');

module.exports = {
  "type": "service_account",
  "project_id": "quickstart-1550558934805",
  "private_key_id": process.env.GSA_PRIVATE_KEY_ID,
  "private_key": process.env.GSA_PRIVATE_KEY,
  "client_email": process.env.GSA_CLIENT_EMAIL,
  "client_id": "113706119067316079720",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/connect-google-api%40quickstart-1550558934805.iam.gserviceaccount.com"
}