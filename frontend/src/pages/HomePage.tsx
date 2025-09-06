export function HomePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">SGSGita Alumni Dashboard</h1>
      <p className="text-gray-600 mb-6">
        Welcome to the SGSGita Alumni data management system. Use the navigation to access different features.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Data Overview</h2>
          <p className="text-gray-600">View and manage alumni records</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Admin Panel</h2>
          <p className="text-gray-600">Advanced data management and export features</p>
        </div>
      </div>
    </div>
  )
}