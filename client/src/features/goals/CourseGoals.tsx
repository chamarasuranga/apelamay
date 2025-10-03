import { ReactNode } from "react";

interface CourseGoalProps {
    id: number;
    title: string;
    description: string;
    children?: ReactNode;
    onDelete?: (id: number) => void;
}

export default function CourseGoal( { id, title, description ,children, onDelete }: CourseGoalProps ) {

    return <article className="goal-card">
            <div className="goal-card-body">
                <h2 className="goal-card-title">{title}</h2>
                <p className="goal-card-desc">{description}</p>
                {children}
            </div>
          <button className="goal-delete" onClick={() => onDelete?.(id)}>Delete</button>
        </article>;
 }