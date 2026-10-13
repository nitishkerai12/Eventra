import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContextValue';
import api from '../utils/axios';

const EventDetail = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [booking, setBooking] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        let active = true;

        const fetchEvent = async () => {
            setLoading(true);
            setError('');
            try {
                const { data } = await api.get(`/events/${id}`);
                if (active) setEvent(data);
            } catch (requestError) {
                if (active) {
                    setError(requestError.response?.data?.message || 'Could not load this event.');
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchEvent();
        return () => {
            active = false;
        };
    }, [id]);

    const requestBookingOtp = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        setError('');
        setMessage('');
        setBooking(true);
        try {
            const { data } = await api.post('/bookings/send-otp');
            setOtpSent(true);
            setMessage(data.message || 'A booking verification code was sent to your email.');
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Could not send a booking verification code.');
        } finally {
            setBooking(false);
        }
    };

    const submitBooking = async (formEvent) => {
        formEvent.preventDefault();
        setError('');
        setMessage('');
        setBooking(true);
        try {
            const { data } = await api.post('/bookings', { eventId: id, otp });
            setMessage(data.message || 'Your booking request has been submitted.');
            setOtp('');
            setOtpSent(false);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Could not submit your booking request.');
        } finally {
            setBooking(false);
        }
    };

    if (loading) {
        return <p className="py-20 text-center text-lg font-semibold">Loading event...</p>;
    }

    if (error && !event) {
        return (
            <section className="mx-auto max-w-3xl rounded-xl bg-white p-8 text-center shadow">
                <p role="alert" className="mb-5 text-red-700">{error}</p>
                <Link to="/" className="font-semibold text-gray-900 underline">Back to events</Link>
            </section>
        );
    }

    if (!event) return null;

    return (
        <article className="mx-auto max-w-5xl overflow-hidden rounded-2xl bg-white shadow">
            {event.imageurl && (
                <img src={event.imageurl} alt={event.title} className="h-64 w-full object-cover sm:h-96" />
            )}
            <div className="p-6 sm:p-10">
                <Link to="/" className="mb-5 inline-block font-semibold text-gray-600 hover:text-black">← All events</Link>
                <div className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">{event.category}</div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">{event.title}</h1>
                    <span className="shrink-0 rounded-full bg-gray-100 px-4 py-2 font-bold text-gray-900">
                        {event.ticketPrice === 0 ? 'Free' : `₹${event.ticketPrice}`}
                    </span>
                </div>
                <div className="my-6 grid gap-3 text-gray-600 sm:grid-cols-2">
                    <p><strong className="text-gray-900">Date:</strong> {new Date(event.date).toLocaleString()}</p>
                    <p><strong className="text-gray-900">Location:</strong> {event.location}</p>
                    <p><strong className="text-gray-900">Availability:</strong> {event.availableSeats} of {event.totalSeats} seats</p>
                </div>
                <p className="whitespace-pre-line leading-7 text-gray-700">{event.description}</p>

                <div className="mt-8 border-t border-gray-100 pt-6">
                    {message && <p role="status" className="mb-4 rounded-lg bg-green-50 p-3 text-green-800">{message}</p>}
                    {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
                    {user?.role === 'admin' ? (
                        <p className="text-gray-600">Administrators manage bookings from the admin dashboard.</p>
                    ) : event.availableSeats <= 0 ? (
                        <p className="font-semibold text-red-700">This event is fully booked.</p>
                    ) : !user ? (
                        <button onClick={() => navigate('/login')} className="rounded-lg bg-gray-900 px-6 py-3 font-bold text-white hover:bg-black">
                            Sign in to book
                        </button>
                    ) : otpSent ? (
                        <form onSubmit={submitBooking} className="flex flex-col gap-3 sm:flex-row">
                            <label className="sr-only" htmlFor="booking-otp">Booking verification code</label>
                            <input
                                id="booking-otp"
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                pattern="[0-9]{6}"
                                maxLength={6}
                                required
                                placeholder="Enter your 6-digit email code"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-3"
                            />
                            <button disabled={booking} className="rounded-lg bg-gray-900 px-6 py-3 font-bold text-white hover:bg-black disabled:opacity-60">
                                {booking ? 'Submitting...' : 'Submit booking'}
                            </button>
                        </form>
                    ) : (
                        <button
                            onClick={requestBookingOtp}
                            disabled={booking}
                            className="rounded-lg bg-gray-900 px-6 py-3 font-bold text-white hover:bg-black disabled:opacity-60"
                        >
                            {booking ? 'Sending code...' : 'Request booking code'}
                        </button>
                    )}
                </div>
            </div>
        </article>
    );
};

export default EventDetail;
