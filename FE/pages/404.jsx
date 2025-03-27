import { useRouter } from "next/router";

export default function Custom404() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
      <h1 className="text-6xl font-bold text-red-600">404</h1>
      <p className="text-2xl mt-4 text-gray-300">Oops! Something went wrong</p>
      <p className="text-gray-400 mt-2">
        The page you are looking for does not exist or an error occurred.
      </p>
      <button
        onClick={() => router.push("/")}
        className="mt-8 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        Return to Home
      </button>
    </div>
  );
}
