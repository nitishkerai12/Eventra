const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth.js');
const {getAllEvents, getEventById, createEvent, updateEvent, deleteEvent } = require('../controllers/eventController.js');

//Get all events
router.get('/', getAllEvents);

//Get event by ID
router.get('/:id', getEventById);

//Create a new event (admin only)
router.post('/', protect, admin, createEvent);  

//Update an event (admin only)
router.put('/:id', protect, admin, updateEvent);    

//Delete an event (admin only)
router.delete('/:id', protect, admin, deleteEvent); 

module.exports = router;
    