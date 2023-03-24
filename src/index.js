import './css/styles.css';
import { Notify } from 'notiflix';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

import ImagesApiService from './components/api-service';
import LoadMoreBtn from './components/load-more-btn';
import createImageCardMarkup from './components/createImageCardMarkup';

const refs = {
  searchForm: document.getElementById('search-form'),
  gallery: document.querySelector('.gallery'),
  scrollToTopBtn: document.querySelector('.scroll-to-top'),
};

const imagesApiService = new ImagesApiService();
const loadMoreBtn = new LoadMoreBtn({ selector: '.load-more' });
const lightBox = new SimpleLightbox('.gallery a', {
  captionsData: 'alt',
  captionDelay: 250,
});

async function onSearch(e) {
  e.preventDefault();

  try {
    imagesApiService.query = e.currentTarget.elements.searchQuery.value.trim();
    if (!imagesApiService.query) {
      return Notify.info('Please write your search query');
    }
    loadMoreBtn.show();
    clearGallery();
    imagesApiService.resetPage();
    await fetchImage();
    refs.searchForm.reset();
  } catch (error) {
    console.log(error.message);
  }
}

async function fetchImage() {
  try {
    loadMoreBtn.hide();
    const backendResponse = await imagesApiService.fetchImages();
    const currentPage = imagesApiService.page - 1;
    const { total, hits, totalHits } = backendResponse.data;

    if (total === 0) {
      return Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );
    }

    renderImages(hits);
    loadMoreBtn.show();
    lightBox.refresh();

    let limit = 40;
    const totalPages = totalHits / limit;

    if (currentPage > totalPages) {
      Notify.info(
        'We are sorry, but you have reached the end of search results.'
      );
      loadMoreBtn.hide();
    }

    if (currentPage === 1) {
      Notify.success(`Hooray we found ${totalHits} images`);
    }
  } catch (error) {
    console.log(error.message);
  }
}

async function onLoadMore() {
  await fetchImage();
  onPageScroll();
}

function renderImages(hits) {
  refs.gallery.insertAdjacentHTML('beforeend', createImageCardMarkup(hits));
}

function clearGallery() {
  refs.gallery.innerHTML = '';
}

function onPageScroll() {
  const { height: cardHeight } =
    refs.gallery.firstElementChild.getBoundingClientRect();

  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });
}

function onScrollToTopClick() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
}

window.addEventListener('scroll', () => {
  if (window.pageYOffset >= 300) {
    refs.scrollToTopBtn.classList.add('show');
  } else {
    refs.scrollToTopBtn.classList.remove('show');
  }
});

refs.searchForm.addEventListener('submit', onSearch);
loadMoreBtn.refs.button.addEventListener('click', onLoadMore);
refs.scrollToTopBtn.addEventListener('click', onScrollToTopClick);
