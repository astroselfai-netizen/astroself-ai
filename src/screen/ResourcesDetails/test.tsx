const ViewBook = () => {
  useEffect(() => {
    AOS.init({ duration: 2000, once: true });
  }, []);

  const api = BooksAPI(true);

  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const Book = location.state;

  const [initialSummary, setInitialSummary] = useState<string[]>([]);
  const [remainingSummary, setRemainingSummary] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (Book?.summary) {
      const summaryParagraphs = Book.summary
        .split(/\r?\n\r?\n+/) // Split by blank lines
        .map((para: any) => para.trim())
        .filter((para: any) => para.length > 0);

      let charCount = 0;
      const splitIndex = summaryParagraphs.findIndex((para: any) => {
        charCount += para.length;
        return charCount > 500; // Split after 500 characters
      });

      if (splitIndex === -1) {
        setInitialSummary(summaryParagraphs);
        setRemainingSummary([]);
      } else {
        setInitialSummary(summaryParagraphs.slice(0, splitIndex + 1));
        setRemainingSummary(summaryParagraphs.slice(splitIndex + 1));
      }
    }
  }, [Book]);

  const isHeading = (text: string) => {
    return text.length < 80 && !text.endsWith('.') && !text.endsWith('?');
  };

  const backendUrl = `${process.env.REACT_APP_API_LIVE}${Book?.image_path}`;
  console.log('Backend-Path is:', backendUrl);

  const RenderFormattedText = ({ htmlContent }: { htmlContent: string }) => {
    return (
      <div
        className="formatted-content"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  };

  const bookSummary = Book?.summary.split(/\n+/);
  console.log('Book Summary:', bookSummary);

  const handleSendEmail = async (book: any) => {
    console.log('Book is:', book);

    try {
      const userName = getValueByKey('username');
      const userEmail = getValueByKey('email');
      const title = book.title;
      const filePath = book.file_path;

      // Show loader
      setIsLoading(true);
      setMessage(null); // Clear any previous message

      const sendEmail = await invokeApi(POST, '/books/send-email', {
        path: filePath,
        email: userEmail,
        user_name: userName,
        title: title,
        slogan: book.slogan,
      });

      if (sendEmail.status) {
        console.log('Email for Book sent successfully');
        setMessage(`Email sent successfully to ${userEmail}`);
      } else {
        setMessage('Failed to send email. Please try again.');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setMessage(
        'An error occurred while sending the email. Please try again.',
      );
    } finally {
      // Hide loader
      setIsLoading(false);
    }
  };

  return (
    <div className="front-side">
      <HomeHeader />
      <div className="detail-page-head">
        <a href="/books" className="btn btn-outline-primary">
          {leftLongArrow.icon}
        </a>
        <Breadcrumb>
          <BreadcrumbItem>
            <a href="/">Home</a>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <a href="/books">Resources</a>
          </BreadcrumbItem>
          <BreadcrumbItem active>{Book?.title}</BreadcrumbItem>
        </Breadcrumb>
      </div>

      <Container className="blog-detail book-details">
        <main data-aos="fade-right" className="border-0 p-0 ">
          <div className="d-flex gap-3 align-items-start mb-3 flex-column flex-md-row">
            <figure className="book-detail-img">
              <img
                src={`${process.env.REACT_APP_API_LIVE}${Book?.image_path}`}
                alt={Book?.title}
              />
            </figure>

            <div className="blog-info">
              <div className="actions mail">
                <Button
                  color={`success`}
                  className="p-2"
                  title="Send Email"
                  onClick={e => {
                    e.stopPropagation();

                    const token = getValueByKey('token');
                    if (!token) {
                      // navigate("/login");
                      // handleDownload()
                      localStorage.setItem('redirectAfterLogin', '/books');
                      navigate('/login');
                    } else {
                      handleSendEmail(Book);
                    }
                  }}
                  disabled={isLoading} // Disable button while loading
                >
                  {/* {isLoading ? "Sending..." : email.icon} */}
                  {/* {isLoading ? <Loader /> : email.icon} */}
                  {email.icon}
                  {isLoading && <Loader />}
                </Button>

                {/* <Button
                  className="p-2"
                  title="Download"
                  style={{ marginLeft: "5px" }}
                  onClick={(e) => {
                    e.stopPropagation();
 
                    const token = getValueByKey("token");
                    if (!token) {
                      navigate("/login");
                    } else {
                      handleDownloadBook(Book);
                    }
                  }}
                >
                  {downloadIcon.icon}
                </Button> */}
              </div>

              {/* Display message */}
              {message && (
                <div
                  className={`message ${
                    message.includes('success') ? 'success' : 'error'
                  }`}
                >
                  {message}
                </div>
              )}

              <div className="summary mt-4">
                <h4 className="text-primary mb-2">Summary</h4>
                {initialSummary.map((para: string, index: number) =>
                  isHeading(para) ? (
                    <p key={index}>
                      <strong>{para}</strong>
                    </p>
                  ) : (
                    <p key={index}>{para}</p>
                  ),
                )}
              </div>
            </div>
          </div>

          {remainingSummary.length > 0 && (
            <div className="remaining-summary">
              {remainingSummary.map((para: string, index: number) =>
                isHeading(para) ? (
                  <p key={index}>
                    <strong>{para}</strong>
                  </p>
                ) : (
                  <p key={index}>{para}</p>
                ),
              )}
            </div>
          )}
        </main>
      </Container>

      <HomeFooter />
    </div>
  );
};
