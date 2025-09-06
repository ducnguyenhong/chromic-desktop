import { Flex, Icon, Input } from '@chakra-ui/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { IoMdStarOutline } from 'react-icons/io'
import { RxCopy } from 'react-icons/rx'
import { SiGooglechrome } from 'react-icons/si'
import { useTabs } from '../../state/tabs'

const AddressBar: React.FC = () => {
  const { activeId, tabs } = useTabs()
  const activeTab = tabs.find((t) => t.id === activeId)
  const [value, setValue] = useState(activeTab?.url ?? '')
  const inputRef = useRef<HTMLInputElement>(null)

  const valueFormat = useMemo(() => {
    if (value.endsWith('/')) {
      return value.slice(0, -1)
    }
    if (value.includes('chromic_home.html')) {
      return ''
    }
    if (value.includes('chromic_settings.html')) {
      return 'chromic://settings'
    }
    return value
  }, [value])

  useEffect(() => {
    // sync value khi URL đổi
    if (activeTab?.url !== undefined) setValue(activeTab.url)
  }, [activeTab?.url])

  // 👇 LẮNG NGHE IPC TỪ MAIN ĐỂ FOCUS DỨT ĐIỂM
  useEffect(() => {
    const handler = () => {
      // đủ “trễ” để thắng mọi lần cướp focus của BrowserView
      requestAnimationFrame(() => {
        setTimeout(() => {
          inputRef.current?.focus()
        }, 200)
      })
    }
    window.ui?.onFocusAddressBar(handler)
    // không cần off trong demo; nếu muốn, expose thêm hàm removeListener trong preload
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && activeId) {
      const input = value.trim()
      let url: string

      // Regex check domain hoặc URL
      const domainRegex = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/
      const urlRegex = /^https?:\/\//

      if (urlRegex.test(input)) {
        // Đã có http:// hoặc https://
        url = input
      } else if (domainRegex.test(input)) {
        // Là domain, thêm https:// vào
        url = `https://${input}`
      } else {
        // Không phải domain, coi như search keyword
        const query = encodeURIComponent(input)
        url = `https://www.google.com/search?q=${query}`
      }

      window.tabs.navigate(activeId, url)
    }
  }

  return (
    <Flex h="34px" w="full" pos="relative">
      <Icon pos="absolute" top="8px" left="10px" zIndex={2}>
        <SiGooglechrome color="#737373" size={17} />
      </Icon>
      <Input
        ref={inputRef}
        bgColor="#f2f2f2"
        value={valueFormat}
        h="34px"
        pl="32px"
        pb="2px"
        pr="64px"
        borderRadius="full"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Tìm kiếm hoặc nhập một URL"
        w="full"
        color="#404040"
        fontSize={14}
        border="1px solid #ededed"
        _focus={{ outline: 'none' }}
      />

      <Flex
        pos="absolute"
        top="5px"
        right="32px"
        w="24px"
        h="24px"
        align="center"
        justify="center"
        borderRadius="full"
        transitionDuration="200ms"
        _hover={{ bgColor: '#d9d9d9' }}
        onClick={() => navigator.clipboard.writeText(activeTab?.url || '')}
      >
        <RxCopy size={15} color="#262626" />
      </Flex>

      <Flex
        pos="absolute"
        top="5px"
        right="6px"
        w="24px"
        h="24px"
        align="center"
        justify="center"
        borderRadius="full"
        transitionDuration="200ms"
        _hover={{ bgColor: '#d9d9d9' }}
      >
        <IoMdStarOutline size={18} color="#262626" />
      </Flex>
    </Flex>
  )
}

export default AddressBar
