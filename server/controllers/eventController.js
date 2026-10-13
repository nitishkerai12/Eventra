const Event = require("../models/Event");

exports.getAllEvents = async (req, res) => {
    try {
        const filter = {};

        if (req.query.category) {
            filter.category = req.query.category;
        }
        if (req.query.location) {
            filter.location = req.query.location;
        }
        if (req.query.ticketPrice) {
            filter.ticketPrice = req.query.ticketPrice;
        }

        const events = await Event.find(filter);
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }
        res.json(event);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createEvent = async (req, res) => {
    try {
        const { title, description, date, location, category, totalSeats, availableSeats, ticketPrice, imageurl } = req.body;

        const newEvent = new Event({
            title,
            description,
            date,
            location,
            category,
            totalSeats,
            availableSeats: availableSeats ?? totalSeats,
            ticketPrice,
            imageurl,
            createdBy: req.user.id,
        });

    
        await newEvent.save();
        res.status(201).json(newEvent);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const { title, description, date, location, category, totalSeats, availableSeats, ticketPrice, imageurl } = req.body;

        const event = await Event.findByIdAndUpdate(
            req.params.id,
            {
                title,
                description,
                date,
                location,
                category,
                totalSeats,
                availableSeats,
                ticketPrice,
                imageurl,
            },
            { new: true }
        );

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        res.json(event);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);
        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }
        res.json({ message: "Event deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
