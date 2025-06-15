'use client';

export default function LandingPage() {
  const handleConnectStrava = () => {
    window.location.href = '/api/auth/strava';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
            Strava Goals Tracker
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
            Set yearly distance goals, track your progress, and analyze your performance 
            with beautiful charts and insights from your Strava activities.
          </p>
          <button
            onClick={handleConnectStrava}
            className="bg-orange-500 hover:bg-orange-600 text-white text-lg font-semibold px-8 py-4 rounded-lg shadow-lg transform transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-orange-300"
          >
            Connect with Strava
          </button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto mb-16">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-4xl mb-4">🏃</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Running Tracking</h3>
            <p className="text-gray-600">
              Monitor your running goals with pace analysis and progress visualization
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-4xl mb-4">🚴</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Cycling Support</h3>
            <p className="text-gray-600">
              Track cycling goals with speed metrics and distance targets
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Progress Charts</h3>
            <p className="text-gray-600">
              Beautiful visualizations showing your progress against yearly targets
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Custom Goals</h3>
            <p className="text-gray-600">
              Set personalized distance goals from casual to competitive levels
            </p>
          </div>
        </div>

        {/* What You'll See Section */}
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">
            What You'll Get
          </h2>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="bg-green-100 rounded-full p-2 mt-1">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Year Progress Tracking</h3>
                <p className="text-gray-600">See exactly how you're progressing toward your yearly distance goal with daily updates and trend analysis.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-green-100 rounded-full p-2 mt-1">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Performance Analytics</h3>
                <p className="text-gray-600">Analyze your pace trends for running or speed improvements for cycling over multiple years.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-green-100 rounded-full p-2 mt-1">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Visual Insights</h3>
                <p className="text-gray-600">Interactive charts showing when you're ahead or behind pace, monthly breakdowns, and recent activity summaries.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-green-100 rounded-full p-2 mt-1">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Goal Flexibility</h3>
                <p className="text-gray-600">Switch between running and cycling modes with sport-specific goal ranges from casual (200+ miles) to competitive (8000+ miles).</p>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-gray-500 text-sm mb-6">
            Your Strava data is used only to display your activity statistics and progress. 
            We don't store your personal information or share data with third parties.
          </p>
          <button
            onClick={handleConnectStrava}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
            Get Started with Strava
          </button>
        </div>
      </div>
    </div>
  );
}