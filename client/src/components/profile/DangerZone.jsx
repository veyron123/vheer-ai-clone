import React, { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import DeleteAccountModal from './DeleteAccountModal';

const DangerZone = () => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Danger Zone</h2>
        <p className="text-sm text-gray-600 mb-6">
          Remove my account and data permanently
        </p>

        <div className="border border-red-200 bg-red-50 rounded-lg p-6">
          <div className="flex items-start mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-900 mb-1">
                Warning: This action cannot be undone
              </p>
              <p className="text-sm text-red-700">
                Deleting your account will permanently remove all your data, subscription information, and access to our services. This action is irreversible.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              What will be deleted:
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 mb-6">
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                Your account profile and personal information
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                All subscription and billing history
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                Usage history and generated content
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                Access to all premium features and services
              </li>
            </ul>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Delete my account
            </button>
          </div>
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