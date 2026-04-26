import Icon from "@/components/ui/icon";

export function TermsDoc() {
  return (
    <div className="prose-agro space-y-5 text-sm text-foreground leading-relaxed">
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
        <Icon name="AlertTriangle" size={15} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">Настоящие Правила являются публичной офертой. Использование платформы означает полное и безоговорочное принятие всех условий.</p>
      </div>

      <section>
        <h2 className="font-heading font-bold text-base text-foreground mb-2">1. Общие положения</h2>
        <p>1.1. Настоящие Правила пользования платформой «АгроПорт» (далее — Правила) регулируют отношения между ООО «АгроПорт» (далее — Оператор) и пользователями платформы, размещённой по адресу <strong>agroport-ai.ru</strong> (далее — Платформа).</p>
        <p className="mt-2">1.2. Платформа предоставляет сервисы аналитики агрорынка, мониторинга посевов, прогнозирования цен, а также сопутствующие услуги (далее совместно — Услуги).</p>
        <p className="mt-2">1.3. Регистрация на Платформе, оформление подписки или иное использование Услуг означает полное и безоговорочное согласие Пользователя с настоящими Правилами. Если Пользователь не согласен с Правилами, он обязан немедленно прекратить использование Платформы.</p>
        <p className="mt-2">1.4. Оператор вправе в одностороннем порядке изменять Правила, уведомив об этом Пользователей через Платформу не менее чем за 7 (семь) календарных дней до вступления изменений в силу.</p>
      </section>

      <section>
        <h2 className="font-heading font-bold text-base text-foreground mb-2">2. Регистрация и учётная запись</h2>
        <p>2.1. Для получения доступа к расширенным возможностям Платформы Пользователь обязан пройти регистрацию, предоставив достоверные персональные данные.</p>
        <p className="mt-2">2.2. Пользователь несёт ответственность за сохранность учётных данных (логина и пароля). Все действия, совершённые с использованием учётных данных Пользователя, считаются совершёнными самим Пользователем.</p>
        <p className="mt-2">2.3. Пользователь обязан незамедлительно уведомить Оператора о несанкционированном доступе к своей учётной записи.</p>
        <p className="mt-2">2.4. Оператор вправе заблокировать или удалить учётную запись Пользователя при нарушении настоящих Правил.</p>
      </section>

      <section>
        <h2 className="font-heading font-bold text-base text-foreground mb-2">3. Тарифы и оплата</h2>
        <p>3.1. Оплата Услуг осуществляется в соответствии с тарифными планами, опубликованными на Платформе. Оператор вправе изменять тарифы, уведомив Пользователей не менее чем за 14 (четырнадцать) календарных дней.</p>
        <p className="mt-2">3.2. При оплате Услуг Пользователь вправе использовать АгроБаллы на условиях, предусмотренных разделом 4 настоящих Правил и Правилами программы «АгроБаллы».</p>
        <p className="mt-2">3.3. Все цены на Платформе указаны в рублях Российской Федерации и не включают НДС, если иное прямо не указано.</p>
        <p className="mt-2">3.4. Оплата производится в безналичном порядке. Факт оплаты подтверждается электронным чеком, направляемым на адрес электронной почты Пользователя.</p>
        <p className="mt-2">3.5. Возврат денежных средств осуществляется в соответствии с законодательством РФ. Подписка считается оказанной в части фактически использованного периода.</p>
      </section>

      <section>
        <h2 className="font-heading font-bold text-base text-foreground mb-2">4. Запрещённые действия</h2>
        <p>Пользователю запрещается:</p>
        <ul className="mt-2 space-y-1.5 list-none">
          {[
            "использовать Платформу в целях, противоречащих законодательству РФ;",
            "распространять вредоносное программное обеспечение;",
            "осуществлять несанкционированный доступ к данным других Пользователей;",
            "перепродавать или передавать доступ к Платформе третьим лицам без письменного согласия Оператора;",
            "использовать автоматизированные средства для парсинга данных Платформы без API-договора;",
            "публиковать заведомо ложную информацию в объявлениях на маркетплейсе.",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0 mt-1.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-heading font-bold text-base text-foreground mb-2">5. Ответственность</h2>
        <p>5.1. Платформа предоставляет аналитические данные и прогнозы в информационных целях. Оператор не несёт ответственности за убытки, возникшие в результате принятия Пользователем хозяйственных решений на основании данных Платформы.</p>
        <p className="mt-2">5.2. Совокупная ответственность Оператора перед Пользователем не может превышать суммы, уплаченной Пользователем за последние 3 (три) месяца пользования Платформой.</p>
        <p className="mt-2">5.3. Оператор не несёт ответственности за перебои в работе Платформы, вызванные действиями третьих лиц, форс-мажорными обстоятельствами или техническими сбоями сетей связи.</p>
      </section>

      <section>
        <h2 className="font-heading font-bold text-base text-foreground mb-2">6. Персональные данные</h2>
        <p>6.1. Обработка персональных данных осуществляется в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных» и Политикой обработки персональных данных, опубликованной на Платформе.</p>
        <p className="mt-2">6.2. Регистрируясь на Платформе, Пользователь даёт согласие на обработку своих персональных данных в целях исполнения договора и улучшения качества Услуг.</p>
      </section>

      <section>
        <h2 className="font-heading font-bold text-base text-foreground mb-2">7. Разрешение споров</h2>
        <p>7.1. Все споры подлежат разрешению путём переговоров. При недостижении соглашения — в судебном порядке по месту нахождения Оператора в соответствии с законодательством РФ.</p>
        <p className="mt-2">7.2. До подачи иска Пользователь обязан направить Оператору письменную претензию. Срок ответа на претензию — 30 (тридцать) рабочих дней.</p>
      </section>

      <div className="p-3 bg-secondary/50 rounded-xl border border-border text-xs text-muted-foreground">
        <strong>Редакция от 26 апреля 2026 г.</strong> · ООО «АгроПорт» · ОГРН: xxxxxxxxxx · Адрес: г. Москва
      </div>
    </div>
  );
}

export function LoyaltyRulesDoc() {
  return (
    <div className="space-y-5 text-sm text-foreground leading-relaxed">
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
        <Icon name="Crown" size={15} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800">
          <strong>Ключевые условия программы:</strong> 1 АгроБалл = 1 рубль · Оплата баллами — до 50% стоимости · Используются только на услугах АгроПорт
        </div>
      </div>

      <section>
        <h2 className="font-heading font-bold text-base text-foreground mb-2">1. Общие положения</h2>
        <p>1.1. Программа лояльности «АгроБаллы» (далее — Программа) — маркетинговая акция ООО «АгроПорт» (далее — Оператор), направленная на поощрение активных пользователей Платформы.</p>
        <p className="mt-2">1.2. АгроБаллы не являются платёжным средством, деньгами, ценными бумагами или иным финансовым инструментом в смысле законодательства РФ. АгроБаллы являются внутренней условной единицей Платформы, используемой исключительно в рамках Программы.</p>
        <p className="mt-2">1.3. Участие в Программе является добровольным и доступно всем зарегистрированным пользователям Платформы.</p>
      </section>

      <section>
        <h2 className="font-heading font-bold text-base text-foreground mb-2">2. Курс и стоимость АгроБаллов</h2>
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
          <p className="font-heading font-bold text-primary text-lg">1 АгроБалл = 1 рубль (₽)</p>
          <p className="text-xs text-muted-foreground mt-1">Курс фиксированный, установлен Оператором и может быть изменён с уведомлением за 30 дней.</p>
        </div>
        <p className="mt-3">2.1. АгроБаллы начисляются в условных единицах. При применении к оплате каждый балл уменьшает сумму к оплате на 1 (один) рубль.</p>
        <p className="mt-2">2.2. Оператор вправе изменить курс АгроБаллов, уведомив участников Программы через Платформу и на электронную почту не менее чем за 30 (тридцать) календарных дней. Начисленные до изменения баллы конвертируются по новому курсу с даты его вступления в силу.</p>
      </section>

      <section>
        <h2 className="font-heading font-bold text-base text-foreground mb-2">3. Начисление АгроБаллов</h2>
        <p>3.1. АгроБаллы начисляются за следующие действия:</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-secondary/70">
                <th className="text-left p-2.5 border border-border font-semibold">Действие</th>
                <th className="text-right p-2.5 border border-border font-semibold whitespace-nowrap">АгроБаллы</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Публикация данных по полям (за каждую публикацию)", "+10"],
                ["Совершение сделки на маркетплейсе (за каждые 1 000 ₽ суммы сделки)", "+1"],
                ["Участие в опросе на Платформе", "+5"],
                ["Приглашение нового пользователя (после первой оплаты им подписки)", "+50"],
                ["Публикация отзыва о Платформе", "+15"],
                ["Прохождение верификации профиля", "+30"],
              ].map(([action, pts], i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-secondary/30"}>
                  <td className="p-2.5 border border-border">{action}</td>
                  <td className="p-2.5 border border-border text-right font-mono font-bold text-emerald-600">{pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3">3.2. Начисление баллов происходит автоматически в течение 24 часов после выполнения квалифицируемого действия.</p>
        <p className="mt-2">3.3. Оператор вправе проверять достоверность действий и аннулировать баллы, начисленные в результате мошеннических или манипулятивных действий.</p>
        <p className="mt-2">3.4. Баллы начисляются только на основной аккаунт. Объединение баллов нескольких аккаунтов не допускается.</p>
      </section>

      <section>
        <h2 className="font-heading font-bold text-base text-foreground mb-2">4. Использование АгроБаллов</h2>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
          <p className="font-semibold text-blue-800 text-xs">Ключевые ограничения при использовании:</p>
          <div className="flex items-start gap-2 text-xs text-blue-700">
            <Icon name="AlertCircle" size={13} className="shrink-0 mt-0.5" />
            <span><strong>Лимит оплаты баллами — не более 50% от стоимости услуги.</strong> Оставшиеся 50% и более оплачиваются денежными средствами.</span>
          </div>
          <div className="flex items-start gap-2 text-xs text-blue-700">
            <Icon name="AlertCircle" size={13} className="shrink-0 mt-0.5" />
            <span><strong>АгроБаллы действительны только на услугах Платформы АгроПорт.</strong> Обмен на денежные средства, перевод другим пользователям и вывод с Платформы не допускаются.</span>
          </div>
        </div>
        <p className="mt-3">4.1. АгроБаллы могут быть применены при оплате следующих услуг Платформы:</p>
        <ul className="mt-2 space-y-1 list-none">
          {[
            "подписки тарифных планов (Профессионал, Корпоративный);",
            "разовых аналитических отчётов и исторических данных;",
            "консультаций экспертов (агроном, трейдер, юрист);",
            "расширенных калькуляторов (оптимизатор севооборота, планировщик затрат);",
            "обучающих курсов и вебинаров на Платформе;",
            "премиум-размещения объявлений на маркетплейсе.",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <Icon name="Check" size={13} className="text-primary shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3">4.2. <strong>Максимальная доля оплаты АгроБаллами — 50% от итоговой стоимости услуги.</strong> Пример: стоимость услуги 10 000 ₽ — можно списать не более 5 000 АгроБаллов (5 000 ₽), оставшиеся 5 000 ₽ оплачиваются деньгами.</p>
        <p className="mt-2">4.3. АгроБаллы не применяются к комиссиям Платформы с торговых сделок маркетплейса.</p>
        <p className="mt-2">4.4. Минимальное количество баллов для применения при оплате — 100 АгроБаллов.</p>
        <p className="mt-2">4.5. АгроБаллы применяются только целыми единицами.</p>
      </section>

      <section>
        <h2 className="font-heading font-bold text-base text-foreground mb-2">5. Срок действия АгроБаллов</h2>
        <p>5.1. Начисленные АгроБаллы действительны в течение 12 (двенадцати) месяцев с момента последней активности аккаунта (вход на Платформу, совершение сделки, оплата услуги).</p>
        <p className="mt-2">5.2. По истечении срока действия неиспользованные баллы аннулируются автоматически. Оператор направляет уведомление за 30 дней до аннулирования.</p>
        <p className="mt-2">5.3. При закрытии аккаунта по инициативе Пользователя накопленные АгроБаллы аннулируются без компенсации.</p>
      </section>

      <section>
        <h2 className="font-heading font-bold text-base text-foreground mb-2">6. Изменение и прекращение Программы</h2>
        <p>6.1. Оператор вправе изменить условия Программы или прекратить её действие, уведомив участников за 30 (тридцать) календарных дней.</p>
        <p className="mt-2">6.2. При прекращении Программы участники вправе использовать накопленные АгроБаллы в течение 60 (шестидесяти) дней с даты уведомления. По истечении этого срока баллы аннулируются.</p>
      </section>

      <div className="p-3 bg-secondary/50 rounded-xl border border-border text-xs text-muted-foreground">
        <strong>Редакция от 26 апреля 2026 г.</strong> · ООО «АгроПорт» · Программа «АгроБаллы»
      </div>
    </div>
  );
}

export function PrivacyDoc() {
  return (
    <div className="space-y-5 text-sm text-foreground leading-relaxed">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex gap-3">
        <Icon name="Shield" size={15} className="text-blue-600 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800">Политика разработана в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных» и Постановлением Правительства РФ от 01.11.2012 № 1119.</p>
      </div>

      <section>
        <h2 className="font-heading font-bold text-base text-foreground mb-2">1. Оператор персональных данных</h2>
        <div className="bg-secondary/50 rounded-xl border border-border p-4 space-y-1.5 text-sm">
          {[
            ["Организация", "ООО «АгроПорт»"],
            ["ИНН / ОГРН", "XXXXXXXXXX / XXXXXXXXXXXXXXXXX"],
            ["Юридический адрес", "г. Москва, XXXXXX"],
            ["Email оператора", "privacy@agroport-ai.ru"],
            ["Телефон", "+7 (XXX) XXX-XX-XX"],
          ].map(([k, v], i) => (
            <div key={i} className="flex gap-3">
              <span className="text-muted-foreground w-40 shrink-0">{k}:</span>
              <span className="font-medium">{v}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-heading font-bold text-base text-foreground mb-2">2. Состав обрабатываемых персональных данных</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-secondary/70">
                <th className="text-left p-2.5 border border-border font-semibold">Категория</th>
                <th className="text-left p-2.5 border border-border font-semibold">Состав</th>
                <th className="text-left p-2.5 border border-border font-semibold">Цель</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Идентификационные", "ФИО, email, телефон", "Регистрация, авторизация"],
                ["Профессиональные", "Организация, регион, роль (фермер/трейдер)", "Персонализация сервиса"],
                ["Технические", "IP-адрес, браузер, cookie", "Безопасность, аналитика"],
                ["Финансовые", "История платежей, баллы", "Расчёты, программа лояльности"],
                ["Маркетинговые", "Предпочтения, история использования функций", "Таргетинг предложений (с согласия)"],
              ].map(([cat, comp, goal], i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-secondary/30"}>
                  <td className="p-2.5 border border-border font-medium">{cat}</td>
                  <td className="p-2.5 border border-border">{comp}</td>
                  <td className="p-2.5 border border-border">{goal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Оператор не обрабатывает специальные категории персональных данных (расовая принадлежность, политические взгляды, состояние здоровья и пр.) в соответствии со ст. 10 152-ФЗ.</p>
      </section>

      <section>
        <h2 className="font-heading font-bold text-base text-foreground mb-2">3. Правовые основания обработки</h2>
        <ul className="space-y-2 list-none">
          {[
            "Согласие субъекта персональных данных (ст. 6 ч. 1 п. 1, ст. 9 152-ФЗ);",
            "Исполнение договора, стороной которого является субъект ПДн (ст. 6 ч. 1 п. 5 152-ФЗ);",
            "Выполнение требований законодательства РФ (налоговый учёт, бухгалтерия);",
            "Законные интересы Оператора (безопасность Платформы, предотвращение мошенничества).",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-heading font-bold text-base text-foreground mb-2">4. Передача данных третьим лицам</h2>
        <p>4.1. Оператор передаёт персональные данные третьим лицам только в случаях:</p>
        <ul className="mt-2 space-y-1.5 list-none">
          {[
            "наличия явного согласия субъекта ПДн;",
            "необходимости для исполнения договора (платёжные системы, курьерские службы);",
            "требований законодательства РФ (ФНС, МВД, суды);",
            "обеспечения работы Платформы (облачные провайдеры) — при наличии надлежащего договора на обработку ПДн.",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground shrink-0 mt-1.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3">4.2. Трансграничная передача персональных данных осуществляется только в страны, обеспечивающие надлежащий уровень защиты ПДн, или при наличии явного согласия субъекта.</p>
      </section>

      <section>
        <h2 className="font-heading font-bold text-base text-foreground mb-2">5. Хранение и защита данных</h2>
        <p>5.1. Персональные данные хранятся на серверах, расположенных на территории Российской Федерации, в соответствии со ст. 18.1 152-ФЗ.</p>
        <p className="mt-2">5.2. Оператор применяет организационные и технические меры защиты: шифрование (TLS 1.3), хэширование паролей, разграничение прав доступа, ведение журналов.</p>
        <p className="mt-2">5.3. Срок хранения персональных данных — в течение срока действия договора с Пользователем и 5 (пяти) лет после его расторжения, если иное не предусмотрено законодательством.</p>
      </section>

      <section>
        <h2 className="font-heading font-bold text-base text-foreground mb-2">6. Права субъекта персональных данных</h2>
        <p>В соответствии со ст. 14–17 152-ФЗ Пользователь имеет право:</p>
        <div className="mt-3 grid sm:grid-cols-2 gap-2">
          {[
            { icon: "Eye", text: "Получить доступ к своим персональным данным" },
            { icon: "Edit", text: "Уточнить и исправить неточные данные" },
            { icon: "Trash2", text: "Потребовать удаления данных (право на забвение)" },
            { icon: "XCircle", text: "Отозвать согласие на обработку данных" },
            { icon: "Ban", text: "Возразить против обработки в маркетинговых целях" },
            { icon: "Download", text: "Получить данные в машиночитаемом формате" },
          ].map((r, i) => (
            <div key={i} className="flex items-center gap-2 p-2.5 bg-secondary/50 rounded-lg border border-border">
              <Icon name={r.icon as "Eye"} size={13} className="text-primary shrink-0" />
              <span className="text-xs">{r.text}</span>
            </div>
          ))}
        </div>
        <p className="mt-3">Для реализации прав направьте запрос на <strong>privacy@agroport-ai.ru</strong>. Ответ — в течение 30 дней.</p>
      </section>

      <section>
        <h2 className="font-heading font-bold text-base text-foreground mb-2">7. Файлы cookie</h2>
        <p>7.1. Платформа использует файлы cookie для обеспечения функциональности, аналитики и персонализации. Пользователь вправе отключить cookie в настройках браузера, однако это может ограничить функциональность Платформы.</p>
      </section>

      <div className="p-3 bg-secondary/50 rounded-xl border border-border text-xs text-muted-foreground">
        <strong>Редакция от 26 апреля 2026 г.</strong> · Зарегистрировано в Роскомнадзоре · privacy@agroport-ai.ru
      </div>
    </div>
  );
}

export function ConsentDoc() {
  return (
    <div className="space-y-5 text-sm text-foreground leading-relaxed">
      <div className="p-4 bg-secondary/60 border border-border rounded-xl text-xs text-muted-foreground">
        Форма согласия на обработку персональных данных в соответствии со ст. 9 Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных»
      </div>

      <p>Я, нижеподписавшийся Пользователь, зарегистрировавшись на платформе <strong>agroport-ai.ru</strong>, свободно, своей волей и в своём интересе даю согласие ООО «АгроПорт» (далее — Оператор) на обработку моих персональных данных на следующих условиях:</p>

      <section>
        <h2 className="font-heading font-bold text-sm text-foreground mb-2">1. Перечень персональных данных</h2>
        <ul className="space-y-1 list-none">
          {[
            "фамилия, имя, отчество;",
            "адрес электронной почты;",
            "номер мобильного телефона;",
            "наименование организации / КФХ (при указании);",
            "регион деятельности;",
            "IP-адрес и технические данные браузера.",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-heading font-bold text-sm text-foreground mb-2">2. Цели обработки</h2>
        <ul className="space-y-1 list-none">
          {[
            "идентификация и аутентификация на Платформе;",
            "исполнение договора об оказании информационных и аналитических услуг;",
            "обеспечение работы программы лояльности «АгроБаллы»;",
            "направление сервисных уведомлений;",
            "направление маркетинговых сообщений (при наличии отдельного согласия);",
            "улучшение качества Платформы и анализ использования.",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-heading font-bold text-sm text-foreground mb-2">3. Действия с персональными данными</h2>
        <p>Сбор, запись, систематизация, накопление, хранение, уточнение (обновление, изменение), извлечение, использование, передача (предоставление, доступ) в случаях, предусмотренных законодательством или договором, обезличивание, блокирование, удаление, уничтожение.</p>
      </section>

      <section>
        <h2 className="font-heading font-bold text-sm text-foreground mb-2">4. Срок и порядок отзыва согласия</h2>
        <p>Настоящее согласие действует с момента регистрации до его отзыва. Отзыв осуществляется путём направления письменного заявления на <strong>privacy@agroport-ai.ru</strong>. После отзыва Оператор прекращает обработку в течение 30 дней, за исключением случаев, когда обработка необходима для исполнения законодательных обязательств.</p>
      </section>

      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
        <p className="text-xs text-emerald-800 font-medium">
          Нажимая «Принять и продолжить» при регистрации, Пользователь подтверждает, что ознакомился с настоящим Согласием, Правилами пользования, Правилами программы «АгроБаллы» и Политикой обработки персональных данных, и принимает их в полном объёме.
        </p>
      </div>

      <div className="p-3 bg-secondary/50 rounded-xl border border-border text-xs text-muted-foreground">
        <strong>Редакция от 26 апреля 2026 г.</strong> · ООО «АгроПорт» · privacy@agroport-ai.ru
      </div>
    </div>
  );
}
