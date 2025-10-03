import { useQuery } from "@tanstack/react-query";

type Todo = { id: number; title: string; completed: boolean };

async function fetchTodos(): Promise<Todo[]> {
  const res = await fetch("https://jsonplaceholder.typicode.com/todos");
  return res.json();
}

export function Todos() {
  // useQuery takes a "key" and a function
  const { data, isLoading, error } = useQuery({
    queryKey: ["todos"], // cache key
    queryFn: fetchTodos, // function to fetch data
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Something went wrong</p>;

  return (
    <ul>
      {data?.slice(0, 5).map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  );
}