async function onScreen(phase) {
  await enter('opening')
  if (phase === 'brief') {
    await store(async () => {
      const { useAppStore } = await import('/src/state/appStore.ts')
      useAppStore.getState().selectMission('m03')
    })
  } else if (phase !== 'world') await goto(phase)
  await wait(500)
  await install()
}
