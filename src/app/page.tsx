"use client"
import React, { useState, useEffect, useRef, FormEvent } from 'react'
import _ from 'lodash'
import { motion, PanInfo, AnimateSharedLayout } from "framer-motion/dist/framer-motion"
import { Button } from '@/components/ui/button'
import { useToast } from "@/hooks/use-toast"
import type { Question, AnswersInput, DragWordItem } from './types'
import parse from "html-react-parser";

function containsPoint(element: any, x: number, y: number) {
  const rect = element.getBoundingClientRect();
  return rect.top <= y && y <= rect.bottom && rect.left <= x && x <= rect.right;
}

export default function Home() {
  const { toast } = useToast()
  const [question, setQuestion] = useState<Question>() // question get from "app/api/data-question"
  const [answersInput, setAnswersInput] = useState<AnswersInput>({}) // answers user input
  const [hoveredSlot, setHoveredSlot] = useState<string | undefined>("") // current drag item hover
  const [isDragging, setDragging] = useState(false) // has drag
  const [resultSubmit, setResultSubmit] = useState<boolean | undefined>()
  const containerRef = useRef<any>([]) // ref to get postion of DOM to check is hover or not

  useEffect(() => {
    const getQuestion = async () => {
      const result = await fetch("/api/data-question")
      const { question: questionTemp }: { question: Question } = await result.json()
      const answersInut: AnswersInput = {}
      questionTemp.blanks.forEach((blank) => {
        answersInut[blank.id] = {
          answer: "",
          isCorrect: false
        }
      })
      setQuestion(questionTemp)
      setAnswersInput(answersInut)
    }

    getQuestion()
  }, [])

  if (!question) return null
  const blanks = _.get(question, 'blanks', [])
  const dragWords = _.get(question, 'dragWords', [])

  // handle when word end drag
  const handleDragEnd = (item: DragWordItem) => {
    setDragging(false);

    if (!_.isNil(hoveredSlot)) {
      const answerFromOrtherInput = Object.keys(answersInput).find((key => answersInput[key].dragItem?.id === item.id))
      const refInput = containerRef.current.find((x: any) => x.id === hoveredSlot)
      
      if (!answersInput[hoveredSlot].dragItem) {
        refInput.inputRef.textContent = ''
      }
      
      if (!answerFromOrtherInput) {
        answersInput[hoveredSlot] = { answer: item.word, dragItem: item }
      } else {
        [answersInput[answerFromOrtherInput], answersInput[hoveredSlot]] = [_.cloneDeep(answersInput[hoveredSlot]), { answer: item.word, dragItem: item }]
      }
      setAnswersInput(answersInput)
    }
  }

  // handle when word drag
  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    let hoverItem: undefined | string = undefined
    containerRef.current.forEach(
      (ref: any) => {
        if (containsPoint(ref.inputRef, info.point.x, info.point.y)) {
          setHoveredSlot(ref.id)
          hoverItem = ref.id
        }
      }
    );
    setHoveredSlot(hoverItem)
    setResultSubmit(undefined)
  }

  // handle when word is start drag
  const handleDragStart = () => {
    setDragging(true)
  }

  // handle answer when user input to answer type input
  const handleSetAnswerInput = (e: FormEvent<HTMLDivElement>, id: number) => {
    const answerInputClone = _.cloneDeep(answersInput)
    answerInputClone[id] = { answer: _.get(e, 'target.textContent', "")}
    setAnswersInput(answerInputClone)
    setResultSubmit(undefined)
  }

  // render all words drag
  const answersBox = dragWords.map((item) => {
      const color = item.color === 'default' ? {} : { color: item.color }
      return ({
        item,
        BoxComponent: (
        <motion.div
          key={item.id}
          className="border-solid border-[1px] px-[15px] py-[5px]"
          style={{...color}}
          layoutId={`${item.id}`}
          drag={true}
          dragElastic={true}
          dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
          animate={{
            scale: 1,
            boxShadow: "2px 2px 1px rgba(0, 0, 0, 0.2)",
            cursor: "grab",
          }}
          whileDrag={{
            cursor: "grabbing",
          }}
          onDragStart={() => {
            handleDragStart();
          }}
          onDrag={(event, info) => {
            handleDrag(event, info);
          }}
          onDragEnd={() => {
            handleDragEnd(item)
          }}
        >
          {item.word}
        </motion.div>
      )
    })})

  const checkAnswers = () => {
    const answersInputClone = _.cloneDeep(answersInput)
    let isCorrectAll = true
    blanks.forEach(blank => {
      const { id } = blank
      const isCorrect = answersInputClone[id].answer === blank.correctAnswer
      answersInputClone[id].isCorrect = isCorrect
      if (!isCorrect) {
        isCorrectAll = false
      }
    })

    const description = isCorrectAll ? 'The answer is correct' : 'The answer is incorrect'
    const variant = isCorrectAll ? "default" : "destructive"
    toast({
      variant,
      title: "Result of the answer",
      description,
      
    })
    setResultSubmit(isCorrectAll)
    setAnswersInput(answersInputClone)
  }

  const renderAnswers = () => {
    const arrId = Object.keys(answersInput).map(key => answersInput[key]?.dragItem?.id)
    return answersBox.map((answerBox) => !arrId.includes(answerBox.item.id) && answerBox.BoxComponent)
  }

  const renderContent = () => {
    let indexInput = -1

    return parse(question?.paragraph, {
      replace: (domNode) => {
        if (domNode.type === "text" && domNode.data.includes("[_input]")) {
          const parts = domNode.data.split("[_input]");
          return (
            <>
              {parts.map((part, index) => {
                const renderItem = () => {
                  indexInput++
                  const dataIdx = indexInput
                  const blank = blanks[dataIdx]
                  const itemAnswer = answersInput[blank.id]
                  const isIncorrect = !_.isNil(resultSubmit) && !itemAnswer?.isCorrect
                  const key = `${part}-${index}`
                  const answerBox = answersBox.find(x => x.item.id === itemAnswer?.dragItem?.id)
                  const BoxComponent = answerBox?.BoxComponent
                  return (
                    <motion.div
                        key={key}
                        animate={{
                          borderColor:
                            isDragging 
                              ? "green"
                              : "",
                        }}
                        contentEditable={answerBox || blank.type === "drag" ? false : true}
                        onInput={(e) => handleSetAnswerInput(e, blank.id)}
                        className={`inline-block min-w-14 min-h-9 border-[1px] px-2 py-1 mx-2 ${isIncorrect ? 'border-red-500' : ''} [&>*]:border-none [&>*]:p-0 [&>*]:!shadow-none`}
                        ref={(ref: HTMLDivElement) => { containerRef.current.push({ id: blanks[dataIdx].id, inputRef: ref })}}
                      >
                        {BoxComponent}
                      </motion.div>
                  )
                }
                return (
                  (
                    <React.Fragment key={index}>
                      {part}
                      {index < parts.length - 1 && renderItem()}
                    </React.Fragment>
                  )
                )
              })}
            </>
          );
        }
      },
    });
  };

  return (
    <AnimateSharedLayout>
      <div className='flex justify-center items-center min-h-screen'>
        <div className='max-w-[1000px] p-4'>
          <div className='flex gap-4 mb-5 relative z-50'>
            {renderAnswers()}
          </div>
          <div className='[&>*]:flex [&>*]:flex-wrap [&>*]:items-center [&>div>span]:m-1'>
            {renderContent()}
          </div>
          <div className='text-center mt-4'>
            <Button onClick={checkAnswers} className='min-w-[200px]'>Submit</Button>
          </div>
        </div>
      </div>
    </AnimateSharedLayout>
  )
}
