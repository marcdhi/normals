import Button from "@/components/ui/button";

export function Home() {
  return (
    <main className="max-w-[900px] mx-auto">
      <section className="mx-auto flex flex-col items-center justify-center min-h-[80vh]">
        <h1 className="text-[2.5em] md:text-[4em] flex gap-2 text-center font-neueMachinaBold">
          <span className="bg-fuchsia-500 px-4 py-2">
            Bitcoin's
          </span>

          <span className="bg-orange-500 px-4 py-2">
            first
          </span>
        </h1>

        <h1 className="text-[2.5em] md:text-[4em] flex gap-2 text-center font-neueMachinaBold mt-4">
          <span className="bg-[#79c600] px-4 py-2">
            Distribution market
          </span>
        </h1>

        <Button className="mt-8">
          Explore markets
        </Button>
      </section>
    </main>
  );
}
