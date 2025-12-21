'use client';
import { Suspense } from 'react';
import PaymentFailure from '../../components/PaymentFailure';

export default function AdminPage() {
  return (
    <Suspense fallback={<div>Đang xử lý thanh toán...</div>}>
      <PaymentFailure />
    </Suspense>
  );
}