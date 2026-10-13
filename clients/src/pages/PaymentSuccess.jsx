import { Link } from 'react-router-dom';

const PaymentSuccess = () => (
    <section className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow">
        <h1 className="mb-3 text-3xl font-bold text-green-700">Payment successful</h1>
        <p className="mb-6 text-gray-600">Your payment was successful. You can review your booking in your dashboard.</p>
        <Link className="inline-block rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white" to="/dashboard">Go to dashboard</Link>
    </section>
);

export default PaymentSuccess;