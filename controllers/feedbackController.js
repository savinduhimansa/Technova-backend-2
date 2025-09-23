import Feedback from '../models/feedbackModel.js'; 

// Save a new feedback
export const createFeedback = async (req, res) => {
  try {
    const { email, name, serviceRating, comments } = req.body;

    const newFeedback = new Feedback({
      email,
      name, 
      serviceRating,
      comments
    });

    await newFeedback.save();
    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback: newFeedback
    });
  } catch (error) {
    console.error('Error saving feedback:', error);
    res.status(400).json({
      message: 'Error submitting feedback',
      error: error.message
    });
  }
};

// Get all feedback
export const getAllFeedback = async (_req, res) => {
  try {
    const feedbackEntries = await Feedback.find().sort({ createdAt: -1 });
    res.status(200).json(feedbackEntries);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      message: 'Failed to retrieve feedback',
      error: error.message
    });
  }
};