/**
 * Dashboard Routes - The AIgnc
 * Multi-tenant dashboard data
 */

const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics for user's organization
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const user = req.user;

    // In a real application, this would query actual data
    // For now, return sample stats based on organization
    const stats = {
      organization: user.organization.name,
      plan: user.subscription.plan,
      metrics: {
        automationsActive: Math.floor(Math.random() * 10) + 1,
        tasksAutomated: Math.floor(Math.random() * 1000) + 100,
        timeSaved: `${Math.floor(Math.random() * 50) + 10} hours`,
        efficiency: `${Math.floor(Math.random() * 30) + 70}%`
      },
      recentActivity: [
        {
          id: 1,
          type: 'automation',
          title: 'Invoice Processing',
          status: 'active',
          lastRun: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 2,
          type: 'report',
          title: 'Weekly Analytics Report',
          status: 'completed',
          lastRun: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 3,
          type: 'workflow',
          title: 'Customer Onboarding',
          status: 'active',
          lastRun: new Date(Date.now() - 7200000).toISOString()
        }
      ],
      upcomingTasks: [
        {
          id: 1,
          title: 'Monthly Report Generation',
          scheduledFor: new Date(Date.now() + 86400000).toISOString()
        },
        {
          id: 2,
          title: 'Data Sync',
          scheduledFor: new Date(Date.now() + 3600000).toISOString()
        }
      ]
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats'
    });
  }
});

/**
 * @route   GET /api/dashboard/automations
 * @desc    Get list of automations
 */
router.get('/automations', auth, async (req, res) => {
  try {
    // Sample automations data
    const automations = [
      {
        id: 1,
        name: 'Invoice Processing',
        description: 'Automatically extract and process invoice data',
        status: 'active',
        runsToday: 15,
        successRate: 98.5,
        lastRun: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: 2,
        name: 'Email Classification',
        description: 'Sort and route incoming emails automatically',
        status: 'active',
        runsToday: 127,
        successRate: 99.2,
        lastRun: new Date(Date.now() - 300000).toISOString()
      },
      {
        id: 3,
        name: 'Report Generation',
        description: 'Generate weekly performance reports',
        status: 'scheduled',
        runsToday: 0,
        successRate: 100,
        lastRun: new Date(Date.now() - 604800000).toISOString()
      }
    ];

    res.json({
      success: true,
      data: automations
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching automations'
    });
  }
});

/**
 * @route   GET /api/dashboard/analytics
 * @desc    Get analytics data
 */
router.get('/analytics', auth, async (req, res) => {
  try {
    // Sample analytics data
    const analytics = {
      timeRange: '30d',
      summary: {
        totalAutomations: 12,
        totalRuns: 4523,
        successRate: 98.7,
        timeSaved: '156 hours'
      },
      chartData: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        runs: [980, 1120, 1205, 1218],
        errors: [12, 8, 15, 6]
      },
      topAutomations: [
        { name: 'Email Classification', runs: 1850 },
        { name: 'Invoice Processing', runs: 920 },
        { name: 'Data Sync', runs: 753 },
        { name: 'Report Generation', runs: 500 },
        { name: 'Customer Notifications', runs: 500 }
      ]
    };

    res.json({
      success: true,
      data: analytics
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics'
    });
  }
});

module.exports = router;
