
import React from 'react';
import GuideHeader from './GuideHeader';
import KeyFeatures from './KeyFeatures';
import GuideSteps from './GuideSteps';
import QuickStart from './QuickStart';
import PerformanceExpectations from './PerformanceExpectations';

const HowItWorksGuide = () => {
  return (
    <div className="space-y-8">
      <GuideHeader />
      <KeyFeatures />
      <GuideSteps />
      <QuickStart />
      <PerformanceExpectations />
    </div>
  );
};

export default HowItWorksGuide;
