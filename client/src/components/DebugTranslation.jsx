import React from 'react';
import { useTranslation } from 'react-i18next';

const DebugTranslation = () => {
  const { t, i18n } = useTranslation('terms');

  const testRefundPolicy = () => {
    const content = t('sections.refundPolicy.content');
    console.log('Current language:', i18n.language);
    console.log('Refund policy title:', t('sections.refundPolicy.title'));
    console.log('Refund policy content:', content);
    console.log('Content split by \\n\\n (old):', content.split('\\n\\n'));
    console.log('Content split by \\n\\n (new):', content.split('\n\n'));
    console.log('Content includes •:', content.includes('•'));
    console.log('Raw translation object:', i18n.getResourceBundle(i18n.language, 'terms'));
  };

  return (
    <div style={{ position: 'fixed', top: '10px', right: '10px', background: 'white', border: '1px solid #ccc', padding: '10px', zIndex: 9999 }}>
      <button onClick={testRefundPolicy}>Debug Refund Policy</button>
      <div>
        <p>Language: {i18n.language}</p>
        <p>Title: {t('sections.refundPolicy.title')}</p>
        <p>Content length: {t('sections.refundPolicy.content').length}</p>
      </div>
    </div>
  );
};

export default DebugTranslation;