import { useState } from "react";
import CourseGoals from "./CourseGoals";
import Header from "./Header";
import CourseGoalsList from "./CourseGoalsList";
import NewGoal from "./NewGoal";
import Button from "./Button";

export type CourseGoal = {
    id: number;
    title: string;
    description: string;
}

export default function Goals() {

    const [goals, setGoals] = useState<CourseGoal[]>([]);

    function addGoal(goal: Omit<CourseGoal,'id'>) {
        setGoals(g=>[...g, { id: g.length ? Math.max(...g.map(x=>x.id))+1 : 1, ...goal }]);
    }

    function handleDeleteGoal(id: number) {
        setGoals(goals.filter(goal => goal.id !== id));}

    return (
        <div className="goals-section">
            <Header image={{ src: '/images/goals.jpg', alt: 'Goals Image' }} >
                <h1>Course Goals</h1>
            </Header>
            <Button el="button">Add Goal</Button>
            <Button el="anchor"> <p> testing.. </p></Button>
            <NewGoal onAdd={addGoal} />
            <CourseGoalsList goals={goals} onDeleteGoal={handleDeleteGoal} />
        </div>
    );
}
