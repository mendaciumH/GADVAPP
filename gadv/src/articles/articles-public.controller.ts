import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ArticlesService } from './articles.service';

@Controller('articles')
export class ArticlesPublicController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get('published')
  async findPublished() {
    const articles = await this.articlesService.findPublished();
    // Transform typeArticle to type_article and compagnieAerienne to compagnie_aerienne for frontend compatibility
    return articles.map(article => {
      const articleAny = article as any;
      return {
        ...article,
        type_article: article.typeArticle,
        typeArticle: undefined,
        compagnie_aerienne: articleAny.compagnieAerienne,
        compagnieAerienne: undefined,
      };
    });
  }

  @Get('published/:id')
  async findOnePublished(@Param('id', ParseIntPipe) id: number) {
    const article = await this.articlesService.findOnePublished(id);
    if (!article) {
      return null;
    }
    const articleAny = article as any;
    return {
      ...article,
      type_article: article.typeArticle,
      typeArticle: undefined,
      compagnie_aerienne: articleAny.compagnieAerienne,
      compagnieAerienne: undefined,
    };
  }
}

