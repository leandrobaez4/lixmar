import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { accountRequest } from '@/account/accountApi'
import { getPublicSession } from '@/auth/publicSession'

function messageDate(value) {
  return value ? new Date(value).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : ''
}

export default function AccountMessagesPage() {
  const [params, setParams] = useSearchParams()
  const selectedId = params.get('id') || ''
  const myId = String(getPublicSession()?.id || '')
  const [conversations, setConversations] = useState([])
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [draft, setDraft] = useState('')
  const [loadingList, setLoadingList] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoadingList(true)
    accountRequest('/conversations', { signal: controller.signal }).then((payload) => {
      if (!controller.signal.aborted) setConversations(Array.isArray(payload.data) ? payload.data : [])
    }).catch((failure) => {
      if (!controller.signal.aborted) setError(failure.message)
    }).finally(() => {
      if (!controller.signal.aborted) setLoadingList(false)
    })
    return () => controller.abort()
  }, [retry])

  useEffect(() => {
    if (!selectedId) {
      setConversation(null)
      setMessages([])
      setNextCursor(null)
      return () => {}
    }
    const controller = new AbortController()
    setLoadingMessages(true)
    setError('')
    Promise.all([
      accountRequest(`/conversations/${encodeURIComponent(selectedId)}`, { signal: controller.signal }),
      accountRequest(`/conversations/${encodeURIComponent(selectedId)}/messages`, { signal: controller.signal }),
    ]).then(([detail, thread]) => {
      if (controller.signal.aborted) return
      setConversation(detail.data)
      setMessages(Array.isArray(thread.data?.data) ? thread.data.data : [])
      setNextCursor(thread.data?.next_cursor || null)
      if (detail.data?.unread_count) {
        accountRequest(`/conversations/${encodeURIComponent(selectedId)}/messages/read`, { method: 'POST' }).then(() => {
          setConversations((current) => current.map((item) => item.id === selectedId ? { ...item, unread_count: 0 } : item))
        }).catch(() => {})
      }
    }).catch((failure) => {
      if (!controller.signal.aborted) setError(failure.message)
    }).finally(() => {
      if (!controller.signal.aborted) setLoadingMessages(false)
    })
    return () => controller.abort()
  }, [selectedId, retry])

  async function loadMore() {
    if (!selectedId || !nextCursor || loadingMore) return
    setLoadingMore(true)
    setError('')
    try {
      const result = await accountRequest(`/conversations/${encodeURIComponent(selectedId)}/messages?cursor=${encodeURIComponent(nextCursor)}`)
      const older = Array.isArray(result.data?.data) ? result.data.data : []
      setMessages((current) => {
        const seen = new Set(current.map((message) => message.id))
        return [...older.filter((message) => !seen.has(message.id)), ...current]
      })
      setNextCursor(result.data?.next_cursor || null)
    } catch (failure) {
      setError(failure.message)
    } finally {
      setLoadingMore(false)
    }
  }

  async function sendMessage(event) {
    event.preventDefault()
    const content = draft.trim()
    if (!selectedId || !content || sending) return
    setSending(true)
    setError('')
    try {
      const result = await accountRequest(`/conversations/${encodeURIComponent(selectedId)}/messages`, {
        method: 'POST', body: JSON.stringify({ type: 'text', content }),
      })
      if (result.data) setMessages((current) => [...current, result.data])
      setDraft('')
      setConversations((current) => current.map((item) => item.id === selectedId ? { ...item, last_message: result.data, updated_at: result.data?.created_at } : item))
    } catch (failure) {
      setError(failure.message)
    } finally {
      setSending(false)
    }
  }

  const orderedMessages = [...messages].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  const other = conversation?.participants?.[0]

  return <section className="lixmar-account-panel" aria-labelledby="account-messages-title">
    <header className="lixmar-account__heading"><h1 id="account-messages-title">Mensajes</h1><p>Conversaciones sobre tus compras y publicaciones.</p></header>
    {error ? <div className="lixmar-account__status lixmar-account__status--error" role="alert"><p>{error}</p><button type="button" onClick={() => setRetry((value) => value + 1)}>Reintentar</button></div> : null}
    <div className="lixmar-account__messages-layout">
      <section className="lixmar-account__conversation-list" aria-label="Conversaciones">
        {loadingList ? <p className="lixmar-account__status" role="status">Cargando conversaciones…</p> : null}
        {!loadingList && conversations.length === 0 ? <p className="lixmar-account__empty">Todavía no tenés conversaciones. Podés iniciar una desde una publicación.</p> : null}
        {conversations.map((item) => <Link className={'lixmar-account__conversation' + (item.id === selectedId ? ' lixmar-account__conversation--active' : '')} key={item.id} to={`/mensajes?id=${encodeURIComponent(item.id)}`}>
          <strong>{item.participants?.[0]?.name || 'Usuario LIXMAR'}</strong>
          <span>{item.product?.title || 'Conversación'}</span>
          <small>{item.last_message?.content || 'Sin mensajes todavía'}</small>
          {item.unread_count > 0 ? <b aria-label={`${item.unread_count} mensajes sin leer`}>{item.unread_count}</b> : null}
        </Link>)}
      </section>
      <section className="lixmar-account__thread" aria-label="Mensajes de la conversación">
        {!selectedId ? <p className="lixmar-account__empty">Elegí una conversación para leer y responder.</p> : null}
        {selectedId && loadingMessages ? <p className="lixmar-account__status" role="status">Cargando mensajes…</p> : null}
        {selectedId && !loadingMessages && conversation ? <>
          <header className="lixmar-account__thread-heading"><h2>{other?.name || 'Usuario LIXMAR'}</h2>{conversation.product ? <Link to={`/producto/${conversation.product.id}`}>{conversation.product.title}</Link> : null}</header>
          {nextCursor ? <button className="lixmar-account__button lixmar-account__button--secondary" type="button" onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'Cargando…' : 'Cargar mensajes anteriores'}</button> : null}
          <div className="lixmar-account__message-list" aria-live="polite">
            {orderedMessages.length === 0 ? <p>Esta conversación todavía no tiene mensajes.</p> : null}
            {orderedMessages.map((message) => <article className={'lixmar-account__message' + (String(message.sender_id) === myId ? ' lixmar-account__message--mine' : '')} key={message.id}>
              {message.type === 'image' && message.image_url ? <a href={message.image_url} target="_blank" rel="noreferrer">Ver imagen adjunta</a> : <p>{message.content}</p>}
              <time dateTime={message.created_at}>{messageDate(message.created_at)}</time>
            </article>)}
          </div>
          {conversation.is_blocked ? <p className="lixmar-account__status">Esta conversación está bloqueada.</p> : <form className="lixmar-account__message-form" onSubmit={sendMessage}>
            <label htmlFor="message-draft">Escribí un mensaje</label>
            <textarea id="message-draft" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={5000} required rows={3} />
            <button className="lixmar-account__button" type="submit" disabled={sending || !draft.trim()}>{sending ? 'Enviando…' : 'Enviar mensaje'}</button>
          </form>}
        </> : null}
      </section>
    </div>
  </section>
}
