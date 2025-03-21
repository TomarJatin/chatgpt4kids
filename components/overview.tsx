import { motion } from "framer-motion";
import Link from "next/link";

import { MessageIcon, VercelIcon } from "./icons";

import happyFavicon from "@/static_assets/happy_favicon_square.png";
import Image from "next/image";

/*
export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="rounded-xl p-6 flex flex-col gap-8 leading-relaxed text-center max-w-xl">
        <p className="flex flex-row justify-center gap-4 items-center">
          <VercelIcon size={32} />
          <span>+</span>
          <MessageIcon size={32} />
        </p>
        <p>
          This is an{' '}
          <Link
            className="font-medium underline underline-offset-4"
            href="https://github.com/vercel/ai-chatbot"
            target="_blank"
          >
            open source
          </Link>{' '}
          chatbot template built with Next.js and the AI SDK by Vercel. It uses
          the{' '}
          <code className="rounded-md bg-muted px-1 py-0.5">streamText</code>{' '}
          function in the server and the{' '}
          <code className="rounded-md bg-muted px-1 py-0.5">useChat</code> hook
          on the client to create a seamless chat experience.
        </p>
        <p>
          You can learn more about the AI SDK by visiting the{' '}
          <Link
            className="font-medium underline underline-offset-4"
            href="https://sdk.vercel.ai/docs"
            target="_blank"
          >
            docs
          </Link>
          .
        </p>
      </div>
    </motion.div>
  );
};
*/

export const Overview = ({
  selectedChatModel,
}: {
  selectedChatModel?: string;
}) => {
  // Check if this is homework mode
  const isHomeworkMode = selectedChatModel === "chat-model-homework";

  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      {isHomeworkMode ? (
        <div className="rounded-xl p-6 flex flex-col gap-4 leading-relaxed text-center max-w-xl">
          <div className="flex flex-row justify-center items-center m-4">
            <div className="bg-white rounded-full m-2 p-2 size-[120px] flex flex-row justify-center items-center border-2 border-gray-300">
              <Image
                alt="Favicon Mascot"
                src={happyFavicon}
                className="size-[100px] object-contain"
                style={{
                  width: "100px",
                }}
                referrerPolicy="no-referrer"
                loading="eager"
                fetchPriority="high"
                decoding="sync"
              />
            </div>
          </div>

          <h2 className="text-xl font-bold">Homework Helper Mode</h2>
          <p>
            I&apos;ll help you work through your homework problems step-by-step!
          </p>
          <div className="text-left mt-2 bg-muted p-4 rounded-lg">
            <p className="font-semibold mb-2">How to use Homework Mode:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                Upload an image of your homework problem or type it in the chat
              </li>
              <li>I&apos;ll guide you through solving it step-by-step</li>
              <li>
                I won&apos;t give you the answer directly - I&apos;m here to
                help you learn!
              </li>
              <li>
                If you get stuck, I&apos;ll provide hints to get you back on
                track
              </li>
            </ol>
          </div>
          <p className="mt-2">
            Ready to get started? Share your homework problem with me!
          </p>
        </div>
      ) : (
        <div className="rounded-xl p-6 flex flex-col gap-2 leading-relaxed text-center max-w-xl">
          <div className="flex flex-row justify-center items-center m-4">
            <div className="bg-white rounded-full m-2 p-2 size-[120px] flex flex-row justify-center items-center border-2 border-gray-300">
              <Image
                alt="Favicon Mascot"
                src={happyFavicon}
                className="size-[100px] object-contain"
                style={{
                  width: "100px",
                }}
                referrerPolicy="no-referrer"
                loading="eager"
                fetchPriority="high"
                decoding="sync"
              />
            </div>
          </div>

          <p>
            <strong>Favicon</strong> is a curious dolphin who can answer almost
            any question!
          </p>
          <p>Ask him anything, and he will do his best to answer.</p>
        </div>
      )}
    </motion.div>
  );
};
