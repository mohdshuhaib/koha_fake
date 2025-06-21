import CheckOutForm from './CheckOutForm'
import CheckInForm from './CheckInForm'

export default function CheckPage() {
  return (
    <div className="p-6 space-y-8">
      <h1 className="text-xl font-semibold">🔁 Check In / Check Out</h1>
      <CheckOutForm />
      <CheckInForm />
    </div>
  )
}
