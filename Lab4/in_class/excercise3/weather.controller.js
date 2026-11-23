const { getCurrentWeather } = require('../services/weather.service');

exports.getWeather = async (req, res, next) => {
  try {
    const city = req.query.city ? String(req.query.city).trim() : '';
    if (!city) {
      return res.status(400).json({ success: false, message: 'The city query parameter is required' });
    }

    const weather = await getCurrentWeather(city);
    res.status(200).json({ success: true, data: weather });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        message: 'The weather service is taking too long to respond. Please try again in a moment.'
      });
    }
    next(error); // any other error goes to the error handler in server.js
  }
};
