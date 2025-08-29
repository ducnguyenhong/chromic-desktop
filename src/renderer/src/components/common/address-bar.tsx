import { HStack, Input } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useTabs } from '../../state/tabs'

const AddressBar: React.FC = () => {
  const { activeId, tabs } = useTabs()
  const activeTab = tabs.find((t) => t.id === activeId)
  const [value, setValue] = useState(activeTab?.url ?? '')

  useEffect(() => {
    if (activeTab) setValue(activeTab.url)
  }, [activeTab?.url, activeId])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && activeId) {
      const url = value.startsWith('http') ? value : `https://${value}`
      window.tabs.navigate(activeId, url)
    }
  }

  return (
    <HStack px={2} py={1} bg="gray.50" w="full">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Nhập địa chỉ web..."
        w="full"
      />
    </HStack>
  )
}

export default AddressBar
