/**
 * Chatbot Routes - The AIgnc
 * AI-powered chatbot using OpenAI
 */

const express = require('express');
const OpenAI = require('openai');

const router = express.Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// System prompt for the chatbot
const SYSTEM_PROMPT = `You are the AI assistant for The AIgnc, an AI-powered workflow automation agency based in Dubai, UAE.

About The AIgnc:
- We specialize in workflow automation for small and medium businesses
- Our team has 14+ years of corporate experience in multinational environments
- We offer retainer packages: Starter ($2,500/mo), Growth ($5,000/mo), Scale ($10,000/mo), and Enterprise (custom)
- Our services include: Workflow Automation, AI Integration, Process Optimization, Dashboard & Analytics
- We serve clients globally with headquarters in Dubai, UAE
- Website: www.theaignc.com | Instagram: @theaignc

Our Approach:
1. Discovery - Deep-dive into current processes and pain points
2. Design - Custom solution architecture
3. Develop - Build and test automation solutions
4. Deploy - Implement with training and support
5. Optimize - Continuous improvement

Key Differentiators:
- Corporate-level expertise (not amateur freelancers)
- Process-first approach (understand business before applying technology)
- Full-stack service (strategy to implementation to support)
- SMB-friendly pricing

Your role:
- Answer questions about our services, pricing, and approach
- Help visitors understand how we can solve their automation challenges
- Be professional, helpful, and concise
- If asked about specific pricing details or contracts, encourage them to schedule a discovery call
- For urgent matters, direct them to WhatsApp: +971554686700

Always maintain a professional yet approachable tone. Be confident about our expertise but not pushy.`;

/**
 * @route   POST /api/chatbot/message
 * @desc    Send message to AI chatbot
 */
router.post('/message', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return res.json({
        success: true,
        reply: "I'm currently in demo mode. To enable full AI capabilities, please configure the OpenAI API key. In the meantime, feel free to contact us directly via WhatsApp at +971554686700 or schedule a discovery call through our website.",
        isDemo: true
      });
    }

    // Build messages array
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message }
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    const reply = completion.choices[0].message.content;

    res.json({
      success: true,
      reply: reply,
      usage: {
        promptTokens: completion.usage.prompt_tokens,
        completionTokens: completion.usage.completion_tokens
      }
    });

  } catch (err) {
    console.error('Chatbot error:', err);

    // Return a friendly fallback response
    res.json({
      success: true,
      reply: "I apologize, but I'm experiencing some technical difficulties. Please try again in a moment, or contact us directly via WhatsApp at +971554686700. Our team will be happy to assist you!",
      isError: true
    });
  }
});

/**
 * @route   GET /api/chatbot/suggestions
 * @desc    Get suggested questions
 */
router.get('/suggestions', (req, res) => {
  const suggestions = [
    "What services does The AIgnc offer?",
    "How much do your automation packages cost?",
    "What industries do you work with?",
    "How long does implementation take?",
    "Can you help with our specific process?",
    "What makes you different from other agencies?",
    "Do you offer a free consultation?"
  ];

  res.json({
    success: true,
    suggestions: suggestions
  });
});

module.exports = router;
