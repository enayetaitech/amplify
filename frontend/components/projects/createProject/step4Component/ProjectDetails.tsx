
import { Step4Props } from '@shared/interface/CreateProjectInterface';
import React from 'react';


export function ProjectDetails({ data }: { data: Step4Props['formData'] }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Project Details</h2>
      <p><strong>Project Name:</strong> {data.name}</p>
      <p><strong>Service:</strong> {data.service}</p>
      <p><strong>Respondent Market:</strong> {data.respondentCountry}</p>
      <p><strong>Respondent Language:</strong> {
        Array.isArray(data.respondentLanguage)
          ? data.respondentLanguage.join(', ')
          : data.respondentLanguage
      }</p>
    </div>
  );
}
