'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { useParams, useRouter } from 'next/navigation';
import { useMeeting } from 'context/MeetingContext';
import { Input } from 'components/ui/input';
import { Button } from 'components/ui/button';


const observerJoinSchema = z.object({
  name: z.string().nonempty('Name is required'),
  email: z.string().email('Invalid email address'),
});
type ObserverJoinData = z.infer<typeof observerJoinSchema>;

const ObserverJoinMeeting: React.FC = () => {
  const router = useRouter();
 const { sessionId } = useParams() as { sessionId: string };
  const { joinRoom,  onObserverWaitingRoomUpdate,
    offObserverWaitingRoomUpdate } = useMeeting();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ObserverJoinData>({
    resolver: zodResolver(observerJoinSchema),
  });

  const onSubmit = (data: ObserverJoinData) => {
    joinRoom(
      {
        sessionId,
        name: data.name,
        email: data.email,
        role: 'Observer',
      },
      ({ observers }) => {
        // once joined, send them to the waiting room
        router.push(
          `/waiting-room/observer/${sessionId}`
        );
      }
    );
  };

  // subscribe to real‐time observer waiting‐room updates
  useEffect(() => {
    const handleUpdate = (list: any[]) => {
      console.log('observer waiting room now has', list.length, 'members');
    };
    onObserverWaitingRoomUpdate(handleUpdate);
    return () => {
      offObserverWaitingRoomUpdate(handleUpdate);
    };
  }, [onObserverWaitingRoomUpdate, offObserverWaitingRoomUpdate]);

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4">Join as Observer</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Name
          </label>
          <Input id="name" {...register('name')} placeholder="Your full name" />
          {errors.name && (
            <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Joining…' : 'Join Meeting'}
        </Button>
      </form>
    </div>
  );
};

export default ObserverJoinMeeting;
