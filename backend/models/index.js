/**
 * Models Index
 * Central export for all Mongoose models
 */

const User = require('./User.model');
const Job = require('./Job.model');
const ApplianceType = require('./ApplianceType.model');
const Location = require('./Location.model');
const Ticket = require('./Ticket.model');
const Promotion = require('./Promotion.model');
const Announcement = require('./Announcement.model');
const ContactMessage = require('./ContactMessage.model');
const FeeRecommendation = require('./FeeRecommendation.model');
const FinancialLog = require('./FinancialLog.model');
const Transaction = require('./Transaction.model');

module.exports = {
    User,
    Job,
    ApplianceType,
    Location,
    Ticket,
    Promotion,
    Announcement,
    ContactMessage,
    FeeRecommendation,
    FinancialLog,
    Transaction
};
