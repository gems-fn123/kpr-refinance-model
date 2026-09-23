import React from 'react';
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";

export function RefinancingCostsForm({ state }) {
  const { 
    adminFee, setAdminFee, 
    provisionPct, setProvisionPct, 
    notaryFee, setNotaryFee, 
    appraisalFee, setAppraisalFee, 
    insuranceFee, setInsuranceFee, 
    discountRate, setDiscountRate 
  } = state;

  return (
    <Card title="Biaya Refinancing">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Administrasi" value={adminFee} setValue={setAdminFee} suffix="Rp" />
        <Field label="Provisi" value={provisionPct} setValue={setProvisionPct} suffix="%" />
        <Field label="Notaris" value={notaryFee} setValue={setNotaryFee} suffix="Rp" />
        <Field label="Appraisal" value={appraisalFee} setValue={setAppraisalFee} suffix="Rp" />
        <Field label="Asuransi" value={insuranceFee} setValue={setInsuranceFee} suffix="Rp" />
        <Field label="Discount rate NPV" value={discountRate} setValue={setDiscountRate} suffix="%" />
      </div>
    </Card>
  );
}
