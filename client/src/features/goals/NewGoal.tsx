import { useRef } from 'react';
import { CourseGoal } from "./Goals";
import Input from './Input';

interface NewGoalProps { onAdd: (goal: Omit<CourseGoal,'id'>) => void }

export default function NewGoal({ onAdd }: NewGoalProps) {
  const titleRef = useRef<HTMLInputElement|null>(null);
  const descRef = useRef<HTMLTextAreaElement|null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const title = (titleRef.current?.value || '').trim();
    const description = (descRef.current?.value || '').trim();
    if(!title) return;
    onAdd({ title, description });
    if(titleRef.current) titleRef.current.value='';
    if(descRef.current) descRef.current.value='';
    titleRef.current?.focus();
  }

  return (
    <form onSubmit={handleSubmit} className="goal-form">
      <div className="goal-form-row">
        <div className="goal-field">
          <label htmlFor="title">Title</label>
          <input id="title" name="title" placeholder="Enter goal title" required ref={titleRef} />
        </div>
        <div className="goal-field">
          <label htmlFor="description">Description</label>
          <textarea id="description" name="description" placeholder="Short description" rows={2} ref={descRef} />
        </div>


        <div className="goal-actions">
          <button type="submit" className="goal-submit">Add Goal</button>
        </div>
      </div>
    </form>
  );
}

