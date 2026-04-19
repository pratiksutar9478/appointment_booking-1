import Navbar from "@/components/Navbar";
import BookingForm from "@/components/BookingForm";

export const metadata = {
  title: "Book Appointment — AppointCare",
};

export default function BookPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Book an Appointment</h1>
          <p className="text-gray-500 mt-2">
            Fill out the form below and receive an instant confirmation via WhatsApp or SMS.
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8">
          <BookingForm />
        </div>
      </main>
    </div>
  );
}
