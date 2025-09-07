import { Box, Flex, useDisclosure } from '@chakra-ui/react'
import { useTabs } from '@renderer/state/tabs'
import { motion } from 'framer-motion'
import { AiOutlineAppstore, AiOutlineMoon } from 'react-icons/ai'
import { BsFiletypeJson } from 'react-icons/bs'
import { IoCodeSlashOutline } from 'react-icons/io5'
import { RiCodeFill } from 'react-icons/ri'
import { TbApi } from 'react-icons/tb'
import { VscSymbolColor } from 'react-icons/vsc'

const MotionBox = motion(Box)

const Tools: React.FC = () => {
  const { open, onToggle } = useDisclosure()
  const { activeId } = useTabs()

  const TOOLS = [
    {
      id: 'color-picker',
      icon: <VscSymbolColor size={19} color="#4f4f4f" />,
      title: 'Color Picker',
      onClick: () =>
        window.sidebar.open({
          url: 'https://www.w3schools.com/colors/colors_picker.asp',
          tabId: activeId
        })
      // window.sidebar.open({ file: 'chromic_tool.html' })
    },
    {
      id: 'json-viewer',
      icon: <BsFiletypeJson size={17} color="#4f4f4f" />,
      title: 'JSON Viewer',
      onClick: () => window.sidebar.open({ url: 'https://jsonformatter.org', tabId: activeId })
    },
    {
      id: 'api-caller',
      icon: <TbApi size={20} color="#4f4f4f" />,
      title: 'API Caller',
      onClick: () =>
        window.sidebar.open({
          url: 'https://apirequest.io',
          tabId: activeId
        })
    },
    {
      id: 'dark-theme',
      icon: <AiOutlineMoon size={20} color="#4f4f4f" />,
      title: 'Dark theme',
      onClick: () => {}
    },
    {
      id: 'wiki-code',
      icon: <IoCodeSlashOutline size={18} color="#4f4f4f" />,
      title: 'Wiki Code',
      onClick: () => {}
    }
  ]

  return (
    <Flex px="10px" align="center" gap="6px">
      <Flex
        title="Developer Tools"
        w="28px"
        h="28px"
        align="center"
        justify="center"
        borderRadius="full"
        bgColor="#f2f2f2"
        transitionDuration="200ms"
        _hover={{ bgColor: '#d9d9d9' }}
        onClick={() => window.tabs.inspectCurrent()}
      >
        <RiCodeFill size={18} color="#4f4f4f" />
      </Flex>

      <MotionBox
        overflow="hidden"
        initial={{ width: 0 }}
        animate={{ width: open ? 'auto' : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <Flex align="center" gap="6px">
          {TOOLS.map((item) => {
            const { icon, id, onClick, title } = item

            return (
              <Flex
                key={id}
                title={title}
                w="28px"
                h="28px"
                align="center"
                justify="center"
                borderRadius="full"
                bgColor="#f2f2f2"
                transitionDuration="200ms"
                _hover={{ bgColor: '#d9d9d9' }}
                onClick={onClick}
              >
                {icon}
              </Flex>
            )
          })}
        </Flex>
      </MotionBox>

      <Flex
        title="Tools"
        w="28px"
        h="28px"
        align="center"
        justify="center"
        borderRadius="full"
        bgColor={open ? '#ccc' : '#f2f2f2'}
        transitionDuration="200ms"
        _hover={{ bgColor: '#d9d9d9' }}
        onClick={onToggle}
      >
        <AiOutlineAppstore size={19} color="#4f4f4f" />
      </Flex>
    </Flex>
  )
}

export default Tools
