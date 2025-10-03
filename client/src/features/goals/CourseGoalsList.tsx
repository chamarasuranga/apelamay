import CourseGoal from "./CourseGoals";
import { CourseGoal as CourseGoalType } from "./Goals";
import InfoBox from "./InfoBox";


type CourseGoalsListProps = {
    goals: CourseGoalType[]
    onDeleteGoal?: (id: number) => void;
}

export default function CourseGoalsList( { goals, onDeleteGoal  }: CourseGoalsListProps ) {


    if(goals.length==0) {
        return <InfoBox mode="warning">
            <p>No goals found. Maybe add one?</p>
        </InfoBox>;
    }

    return (
        <ul className="goal-list">
            {goals.map(goal => (
                <li key={goal.id} className="goal-list-item">
                    <CourseGoal id={goal.id} title={goal.title} description={goal.description} onDelete={onDeleteGoal} />
                    </li>
                ))}
            </ul>
        )
    }