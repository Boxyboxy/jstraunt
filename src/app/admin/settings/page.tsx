export const metadata = { title: 'Settings' }

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-burgundy-900">Settings</h1>
        <p className="text-burgundy-400 text-sm mt-1">Manage your profile and notification preferences</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        <div className="bg-white rounded-lg border border-cream-300 p-6">
          <h2 className="text-lg font-medium text-burgundy-900 mb-1">Business Profile</h2>
          <p className="text-sm text-burgundy-400 mb-4">
            Update your business name, logo, and contact information.
          </p>
          <p className="text-sm text-burgundy-300 italic">Coming in a future update.</p>
        </div>

        <div className="bg-white rounded-lg border border-cream-300 p-6">
          <h2 className="text-lg font-medium text-burgundy-900 mb-1">Notification Templates</h2>
          <p className="text-sm text-burgundy-400 mb-4">
            Customize the email and SMS messages sent to guests.
          </p>
          <p className="text-sm text-burgundy-300 italic">Coming in a future update.</p>
        </div>

        <div className="bg-white rounded-lg border border-cream-300 p-6">
          <h2 className="text-lg font-medium text-burgundy-900 mb-1">Integrations</h2>
          <p className="text-sm text-burgundy-400 mb-4">
            Configure Resend (email), Twilio (SMS), and payment providers.
          </p>
          <p className="text-sm text-burgundy-300 italic">Coming in a future update.</p>
        </div>
      </div>
    </div>
  )
}
