import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import DeleteAccountModal from './DeleteAccountModal';

const DangerZone = () => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <>
      <div className="card p-8">
        <h2 className="text-2xl font-bold mb-6">Danger Zone</h2>
        <p className="text-gray-600 mb-6">
          Remove my account and data permanently
        </p>
        
        {/* Warning Box */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800 mb-1">
                Warning: This action cannot be undone
              </p>
              <p className="text-sm text-red-700">
                Deleting your account will permanently remove all your data, subscription information, and access to our services. This action is irreversible.
              </p>
            </div>
          </div>
        </div>

        {/* What will be deleted section */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            What will be deleted:
          </h3>
          <ul className="space-y-2 mb-6">
            <li className="flex items-center text-sm text-gray-700">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-3 flex-shrink-0"></span>
              Your account profile and personal information
            </li>
            <li className="flex items-center text-sm text-gray-700">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-3 flex-shrink-0"></span>
              All subscription and billing history
            </li>
            <li className="flex items-center text-sm text-gray-700">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-3 flex-shrink-0"></span>
              Usage history and generated content
            </li>
            <li className="flex items-center text-sm text-gray-700">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-3 flex-shrink-0"></span>
              Access to all premium features and services
            </li>
          </ul>

          {/* Delete Button */}
          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Delete my account
          </button>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <DeleteAccountModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </>
  );
};

export default DangerZone;