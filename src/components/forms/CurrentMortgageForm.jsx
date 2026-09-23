import React from 'react';
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";
import { SchemeSelect } from "../ui/SchemeSelect";
import { SchemeFields } from "./SchemeFields";

export function CurrentMortgageForm({ state }) {
  const { 
    propertyValue, setPropertyValue, 
    balance, setBalance, 
    remainingYears, setRemainingYears, 
    oldScheme, setOldScheme, 
    oldCfg, setOldCfg, 
    oldMonthlyFee, setOldMonthlyFee 
  } = state;

  return (
    <Card title="KPR Bank Saat Ini">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nilai properti" value={propertyValue} setValue={setPropertyValue} suffix="Rp" error={propertyValue <= 0 ? "Wajib > 0" : ""} />
        <Field label="Sisa pokok" value={balance} setValue={setBalance} suffix="Rp" error={balance <= 0 ? "Wajib > 0" : ""} />
        <Field label="Sisa tenor" value={remainingYears} setValue={setRemainingYears} suffix="tahun" error={remainingYears <= 0 ? "Wajib > 0" : ""} />
        <SchemeSelect value={oldScheme} setValue={setOldScheme} />
      </div>
      <div className="mt-3">
        <SchemeFields scheme={oldScheme} cfg={oldCfg} setCfg={setOldCfg} />
      </div>
      <div className="mt-3">
        <Field label="Biaya bulanan lain" value={oldMonthlyFee} setValue={setOldMonthlyFee} suffix="Rp" />
      </div>
    </Card>
  );
}
