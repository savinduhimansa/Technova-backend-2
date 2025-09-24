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


// --- ADD: update (edit) a feedback by id
export const updateFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, serviceRating, comments } = req.body;

    const updated = await Feedback.findByIdAndUpdate(
      id,
      { email, name, serviceRating, comments },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    res.status(200).json({
      message: "Feedback updated successfully",
      feedback: updated,
    });
  } catch (error) {
    console.error("Error updating feedback:", error);
    res.status(400).json({
      message: "Error updating feedback",
      error: error.message,
    });
  }
};

// --- ADD: delete a feedback by id
export const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Feedback.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    res.status(200).json({
      message: "Feedback deleted successfully",
      feedback: deleted,
    });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    res.status(400).json({
      message: "Error deleting feedback",
      error: error.message,
    });
  }
};


